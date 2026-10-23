/**
 * Psaní e-mailů ze šablon.
 *
 * Šablona obsahuje zástupné znaky ve tvaru {{nazev}}. `sestavMail()` je nahradí
 * daty z vybrané zakázky a vrátí hotový text včetně odkazu pro otevření
 * v Gmailu.
 *
 * Přímé odeslání přes Gmail API potřebuje OAuth přihlášení (stejné jako Drive).
 * Dokud není hotové, appka e-mail předvyplní a otevře v Gmailu kanceláře —
 * zpráva odejde z jejich vlastního účtu a v Gmailu zůstane v Odeslané poště.
 */
import { eq } from "drizzle-orm";
import { db } from "../../database";
import { dokumenty, evidence, zakazky } from "../../database/schema";
import { docCatalog } from "../docgen";
import { nactiFirmu } from "../nastaveni";
import { ceskeDatum, dnesISO } from "./data";

export const DOSTUPNE_ZNACKY: { znacka: string; popis: string }[] = [
  { znacka: "{{cislo}}", popis: "číslo zakázky" },
  { znacka: "{{nazev}}", popis: "název stavby nebo objektu" },
  { znacka: "{{klient}}", popis: "zákazník, případně investor" },
  { znacka: "{{kontakt}}", popis: "kontaktní údaj zákazníka" },
  { znacka: "{{adresa}}", popis: "adresa stavby" },
  { znacka: "{{typ}}", popis: "typ zakázky z rejstříku" },
  { znacka: "{{termin}}", popis: "termín odevzdání z rejstříku" },
  { znacka: "{{cena}}", popis: "cena bez DPH z rejstříku" },
  { znacka: "{{cisloFaktury}}", popis: "číslo faktury z rejstříku" },
  { znacka: "{{datum}}", popis: "dnešní datum" },
  { znacka: "{{zpracovatel}}", popis: "zpracovatel, projektant, případně jednatel" },
  { znacka: "{{firma}}", popis: "název firmy z nastavení" },
  { znacka: "{{firmaKontakt}}", popis: "e-mail a telefon firmy" },
  { znacka: "{{dokumenty}}", popis: "seznam vygenerovaných dokumentů zakázky" },
  { znacka: "{{slozka}}", popis: "odkaz na složku zakázky na Disku" },
];

function cenaText(cena: number): string {
  if (!cena) return "";
  return cena.toLocaleString("cs-CZ").replace(/ /g, " ");
}

/** Nahradí {{znacky}} v textu. Vrací i seznam znaků, které zůstaly nevyplněné. */
export function vyplnSablona(
  text: string,
  hodnoty: Record<string, string>,
): { text: string; nevyplnene: string[] } {
  const nevyplnene: string[] = [];
  const vysledek = text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (cely, klic: string) => {
    const hodnota = hodnoty[klic];
    if (hodnota === undefined || hodnota.trim() === "") {
      if (!nevyplnene.includes(cely)) nevyplnene.push(cely);
      return cely;
    }
    return hodnota;
  });
  return { text: vysledek, nevyplnene };
}

export type VstupMailu = {
  zakazkaId?: number;
  sablona?: { nazev: string; predmet: string; telo: string };
  komu?: string;
  kopie?: string;
};

export type SestavenyMail = {
  komu: string;
  kopie: string;
  predmet: string;
  telo: string;
  nevyplnene: string[];
  hodnoty: Record<string, string>;
};

/** Sestaví e-mail z uložené šablony a dat zakázky. Nic neodesílá. */
export async function sestavMail(vstup: VstupMailu): Promise<SestavenyMail> {
  const firma = await nactiFirmu();
  const hodnoty: Record<string, string> = {
    firma: firma.nazev,
    firmaKontakt: [firma.email, firma.telefon].filter(Boolean).join(" · "),
    datum: ceskeDatum(dnesISO()),
  };

  if (vstup.zakazkaId) {
    const [z] = await db.select().from(zakazky).where(eq(zakazky.id, vstup.zakazkaId));
    if (z) {
      const soubory = await db
        .select({ nazev: dokumenty.nazev, klic: dokumenty.klic })
        .from(dokumenty)
        .where(eq(dokumenty.zakazkaId, z.id));
      const podleKlice = new Map(docCatalog().map((d) => [d.klic, d.nazev]));
      const radky = soubory.length
        ? soubory
            .sort((a, b) => a.klic.localeCompare(b.klic, "cs"))
            .map((s) => `   · ${s.klic} — ${podleKlice.get(s.klic) ?? s.nazev}`)
        : [];
      Object.assign(hodnoty, {
        cislo: z.cislo,
        nazev: z.nazevStavby || z.nazevObjektu,
        klient: z.zakaznik || z.investor || z.zakaznikZastupce,
        kontakt: z.zakaznikKontakt,
        adresa: [z.adresaStavby, z.parcela, z.katastr].filter(Boolean).join(", "),
        typ: z.profese.split("/")[0]?.trim() ?? "",
        termin: z.datum,
        zpracovatel:
          z.zpracovatelJmeno || z.projektantJmeno || firma.jednatel,
        dokumenty: radky.join("\n"),
      });

      // Obchodní údaje (typ, cena, faktura, termín) vedeme v rejstříku zakázek.
      const [e] = await db
        .select()
        .from(evidence)
        .where(eq(evidence.zakazkaId, z.id));
      if (e) {
        Object.assign(hodnoty, {
          typ: e.typ || hodnoty.typ,
          termin: e.terminOdevzdani || hodnoty.termin,
          cena: cenaText(e.cenaBezDph),
          cisloFaktury: e.cisloFaktury,
          slozka: e.odkazNaSlozku,
          klient: e.klient || hodnoty.klient,
          kontakt: e.kontakt || hodnoty.kontakt,
        });
      }
    }
  }

  const { text: predmet, nevyplnene: n1 } = vyplnSablona(
    vstup.sablona?.predmet ?? "",
    hodnoty,
  );
  const { text: telo, nevyplnene: n2 } = vyplnSablona(vstup.sablona?.telo ?? "", hodnoty);

  return {
    komu: vstup.komu?.trim() || hodnoty.kontakt || "",
    kopie: vstup.kopie?.trim() || "",
    predmet,
    telo,
    nevyplnene: [...new Set([...n1, ...n2])],
    hodnoty,
  };
}

/** Odkaz, který otevře předvyplněný e-mail v Gmailu. Nic neodesílá. */
export function gmailOdkaz(mail: { komu: string; kopie: string; predmet: string; telo: string }): string {
  const p = new URLSearchParams({ view: "cm", fs: "1" });
  if (mail.komu) p.set("to", mail.komu);
  if (mail.kopie) p.set("cc", mail.kopie);
  if (mail.predmet) p.set("su", mail.predmet);
  if (mail.telo) p.set("body", mail.telo);
  return `https://mail.google.com/mail/?${p.toString()}`;
}

/** Záložní odkaz pro poštovní klient na počítači. */
export function mailtoOdkaz(mail: {
  komu: string;
  kopie: string;
  predmet: string;
  telo: string;
}): string {
  const p = new URLSearchParams();
  if (mail.kopie) p.set("cc", mail.kopie);
  if (mail.predmet) p.set("subject", mail.predmet);
  if (mail.telo) p.set("body", mail.telo);
  return `mailto:${encodeURIComponent(mail.komu)}?${p.toString()}`;
}