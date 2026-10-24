/**
 * Agendová data — rejstřík zakázek, hlídání revizních lhůt, rejstřík norem,
 * termíny a změny a e-mailové šablony.
 *
 * Vše se ukládá do SQLite (Turso). Prázdné tabulky se při prvním čtení naplní
 * výchozím obsahem z rev-02-2026 — viz `zajistiVychoziData()`.
 */
import { and, asc, desc, eq, isNull, like, or, sql } from "drizzle-orm";
import { db } from "../../database";
import {
  emailSablony,
  emailZpravy,
  evidence,
  normy,
  periodickeRevize,
  terminyZmeny,
  zakazky,
} from "../../database/schema";
import { LHUTY_REVIZI, lhutaText } from "./ciselnik";
import { VYCHOZI_NORMY, VYCHOZI_TERMINY } from "./vychozi";
import { VYCHOZI_SABLONY } from "./vychoziSablony";

// ------------------------------------------------------------------ pomocné

export function dnesISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Posune datum ve tvaru RRRR-MM-DD o zadaný počet dní. */
export function prictiDny(iso: string, dni: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return "";
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  d.setUTCDate(d.getUTCDate() + dni);
  return d.toISOString().slice(0, 10);
}

/** Rozdíl ve dnech mezi dvěma daty RRRR-MM-DD (b − a). */
export function rozdilDni(a: string, b: string): number | null {
  const pa = /^(\d{4})-(\d{2})-(\d{2})$/.exec(a.trim());
  const pb = /^(\d{4})-(\d{2})-(\d{2})$/.exec(b.trim());
  if (!pa || !pb) return null;
  const da = Date.UTC(Number(pa[1]), Number(pa[2]) - 1, Number(pa[3]));
  const dbb = Date.UTC(Number(pb[1]), Number(pb[2]) - 1, Number(pb[3]));
  return Math.round((dbb - da) / 86_400_000);
}

/** České datum z RRRR-MM-DD (7. 10. 2026). */
export function ceskeDatum(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return iso;
  return `${Number(m[3])}. ${Number(m[2])}. ${m[1]}`;
}

// -------------------------------------------------------- naplnění výchozím

let naplneno = false;

/** Naplní prázdné tabulky výchozím obsahem. Opakované volání nic nemění. */
export async function zajistiVychoziData(): Promise<void> {
  if (naplneno) return;

  const [n] = await db.select({ pocet: sql<number>`count(*)` }).from(normy);
  if (Number(n?.pocet ?? 0) === 0) {
    await db.insert(normy).values(
      VYCHOZI_NORMY.map((x) => ({
        poradi: x.poradi,
        oznaceni: x.oznaceni,
        nazev: x.nazev,
        edice: x.edice,
        druh: x.druh,
        ucinnostOd: x.ucinnostOd,
        prechodneDo: x.prechodneDo,
        pouziti: x.pouziti,
        posledniOvereni: x.posledniOvereni,
        overil: x.overil,
        stav: x.stav,
        odkazOverit: x.odkazOverit,
        poznamka: x.poznamka,
      })),
    );
  }

  const [t] = await db.select({ pocet: sql<number>`count(*)` }).from(terminyZmeny);
  if (Number(t?.pocet ?? 0) === 0) {
    await db.insert(terminyZmeny).values(VYCHOZI_TERMINY);
  }

  const [s] = await db.select({ pocet: sql<number>`count(*)` }).from(emailSablony);
  if (Number(s?.pocet ?? 0) === 0) {
    await db.insert(emailSablony).values(VYCHOZI_SABLONY);
  }

  naplneno = true;
}

// ---------------------------------------------------------- rejstřík zakázek

/** Zajistí, že zakázka z generátoru má řádek v rejstříku. Vrací řádek. */
export async function zajistiEvidence(zakazkaId: number) {
  const [existujici] = await db.select().from(evidence).where(eq(evidence.zakazkaId, zakazkaId));
  if (existujici) return existujici;

  const [zakazka] = await db.select().from(zakazky).where(eq(zakazky.id, zakazkaId));
  if (!zakazka) return null;

  const [novy] = await db
    .insert(evidence)
    .values({
      zakazkaId,
      cislo: zakazka.cislo,
      nazev: zakazka.nazevStavby || zakazka.nazevObjektu,
      klient: zakazka.zakaznik || zakazka.investor,
      kontakt: zakazka.zakaznikKontakt,
      typ: typZProfese(zakazka.profese),
      datumPoptavky: zakazka.datum,
      terminOdevzdani: zakazka.datum,
    })
    .returning();
  return novy;
}

/** Doplní typ zakázky z volného textu profese v generátoru. */
export function typZProfese(profese: string): string {
  const p = profese.toLowerCase();
  if (p.includes("fve") || p.includes("fotovolt")) return "FVE";
  if (p.includes("lps") || p.includes("blesk")) return "LPS";
  if (p.includes("mar") || p.includes("měření a regulace")) return "MaR";
  if (p.includes("reviz") || p.includes("revíz")) return "Revize";
  if (p.includes("posud")) return "Posudek";
  if (p.includes("elektro")) return "Elektro";
  return "";
}

/** Přenese změny identifikačních údajů ze zakázky do jejího řádku v rejstříku. */
export async function synchronizujEvidence(zakazkaId: number): Promise<void> {
  const [zakazka] = await db.select().from(zakazky).where(eq(zakazky.id, zakazkaId));
  if (!zakazka) return;
  await zajistiEvidence(zakazkaId);
  await db
    .update(evidence)
    .set({
      cislo: zakazka.cislo,
      nazev: zakazka.nazevStavby || zakazka.nazevObjektu,
      klient: zakazka.zakaznik || zakazka.investor,
      kontakt: zakazka.zakaznikKontakt,
      updatedAt: new Date(),
    })
    .where(eq(evidence.zakazkaId, zakazkaId));
}

export type FiltrEvidence = {
  hledat?: string;
  typ?: string;
  stav?: string;
  rok?: string;
  nezaplaceno?: boolean;
};

export async function seznamEvidence(filtr: FiltrEvidence = {}) {
  await zajistiVychoziData();
  const podminky = [];
  const hledat = filtr.hledat?.trim();
  if (hledat) {
    podminky.push(
      or(
        like(evidence.cislo, `%${hledat}%`),
        like(evidence.nazev, `%${hledat}%`),
        like(evidence.klient, `%${hledat}%`),
        like(evidence.poznamka, `%${hledat}%`),
      ),
    );
  }
  if (filtr.typ) podminky.push(eq(evidence.typ, filtr.typ));
  if (filtr.stav) podminky.push(eq(evidence.stav, filtr.stav));
  if (filtr.rok) podminky.push(like(evidence.cislo, `${filtr.rok}%`));
  if (filtr.nezaplaceno) {
    podminky.push(sql`${evidence.cenaBezDph} > 0 and ${evidence.zaplaceno} <> 'Ano'`);
  }

  const dotaz = db.select().from(evidence);
  const radky = podminky.length
    ? await dotaz.where(and(...podminky)).orderBy(asc(evidence.cislo))
    : await dotaz.orderBy(asc(evidence.cislo));
  return radky;
}

/** Souhrny pro hlavičku rejstříku. */
export async function souhrnEvidence() {
  await zajistiVychoziData();
  const radky = await db.select().from(evidence);
  const cenik = new Map<string, { pocet: number; cena: number }>();
  let cenaCelkem = 0;
  let nezaplaceno = 0;
  let nefakturovano = 0;
  for (const r of radky) {
    cenaCelkem += r.cenaBezDph;
    if (r.zaplaceno !== "Ano") nezaplaceno += r.cenaBezDph;
    if (r.fakturovano !== "Ano") nefakturovano += 1;
    const klic = r.typ || "neurčeno";
    const z = cenik.get(klic) ?? { pocet: 0, cena: 0 };
    z.pocet += 1;
    z.cena += r.cenaBezDph;
    cenik.set(klic, z);
  }
  return {
    pocet: radky.length,
    cenaCelkem,
    nezaplaceno,
    nefakturovano,
    podleTypu: [...cenik.entries()]
      .map(([typ, z]) => ({ typ, ...z }))
      .sort((a, b) => b.cena - a.cena || a.typ.localeCompare(b.typ, "cs")),
  };
}

// ------------------------------------------------------------ revizní lhůty

export type RadekRevize = Awaited<ReturnType<typeof seznamRevizi>>[number];

/** Řádky hlídání lhůt s dopočteným termínem a stavem. */
export async function seznamRevizi() {
  await zajistiVychoziData();
  const radky = await db
    .select()
    .from(periodickeRevize)
    .orderBy(asc(periodickeRevize.datumPosledniRevize));
  const dnes = dnesISO();
  return radky
    .map((r) => {
      const pristi = prictiDny(r.datumPosledniRevize, r.lhutaDni);
      const dni = pristi ? rozdilDni(dnes, pristi) : null;
      const stav =
        dni === null ? "" : dni < 0 ? "PO TERMÍNU" : dni <= 60 ? "Blíží se" : "V termínu";
      return {
        ...r,
        lhutaPopis: r.lhutaText || lhutaText(r.lhutaDni),
        datumPristiRevize: pristi,
        dniDoTerminu: dni,
        stav,
      };
    })
    .sort((a, b) => {
      const poradi: Record<string, number> = { "PO TERMÍNU": 0, "Blíží se": 1, "V termínu": 2, "": 3 };
      const p = (poradi[a.stav] ?? 3) - (poradi[b.stav] ?? 3);
      if (p !== 0) return p;
      return (a.dniDoTerminu ?? 9e9) - (b.dniDoTerminu ?? 9e9);
    });
}

export async function souhrnRevizi() {
  const radky = await seznamRevizi();
  return {
    pocet: radky.length,
    poTerminu: radky.filter((r) => r.stav === "PO TERMÍNU").length,
    bliziSe: radky.filter((r) => r.stav === "Blíží se").length,
    vTerminu: radky.filter((r) => r.stav === "V termínu").length,
    bezDatu: radky.filter((r) => !r.stav).length,
  };
}

/** Lhůty pro výběr v UI i v XLSX. */
export function lhutyProVyber() {
  return LHUTY_REVIZI.map((l) => ({ dni: l.dni, popisek: `${l.delka} – ${l.popis}` }));
}

// ------------------------------------------------------------ rejstřík norem

export type FiltrNormy = { hledat?: string; druh?: string; stav?: string; kontrola?: string };

/** Stav kontroly dopočítaný ze sloupců — stejná logika jako v XLSX. */
export function stavKontroly(r: {
  edice: string;
  zjistenaEdice: string;
  posledniOvereni: string;
}): { zmena: string; stavKontroly: string } {
  const zjistena = r.zjistenaEdice.trim();
  const zmena = zjistena === "" ? "beze změny" : zjistena === r.edice.trim() ? "beze změny" : "ZMĚNA";
  if (zmena === "ZMĚNA") return { zmena, stavKontroly: "AKTUALIZOVAT" };
  if (r.posledniOvereni.trim() === "") return { zmena, stavKontroly: "NEOVĚŘENO" };
  const stari = rozdilDni(r.posledniOvereni, dnesISO());
  if (stari !== null && stari > 365) return { zmena, stavKontroly: "PO TERMÍNU" };
  return { zmena, stavKontroly: "OK" };
}

export async function seznamNormy(filtr: FiltrNormy = {}) {
  await zajistiVychoziData();
  const podminky = [];
  const hledat = filtr.hledat?.trim();
  if (hledat) {
    podminky.push(
      or(
        like(normy.oznaceni, `%${hledat}%`),
        like(normy.nazev, `%${hledat}%`),
        like(normy.poznamka, `%${hledat}%`),
        like(normy.pouziti, `%${hledat}%`),
      ),
    );
  }
  if (filtr.druh) podminky.push(eq(normy.druh, filtr.druh));

  const dotaz = db.select().from(normy);
  const radky = podminky.length
    ? await dotaz.where(and(...podminky)).orderBy(asc(normy.poradi))
    : await dotaz.orderBy(asc(normy.poradi));

  let vysledek = radky.map((r) => ({ ...r, ...stavKontroly(r) }));
  if (filtr.stav) vysledek = vysledek.filter((r) => r.stav === filtr.stav);
  if (filtr.kontrola) vysledek = vysledek.filter((r) => r.stavKontroly === filtr.kontrola);
  return vysledek;
}

export async function souhrnNormy() {
  const radky = await seznamNormy();
  const pocet = (k: string) => radky.filter((r) => r.stavKontroly === k).length;
  return {
    pocet: radky.length,
    ok: pocet("OK"),
    poTerminu: pocet("PO TERMÍNU"),
    aktualizovat: pocet("AKTUALIZOVAT"),
    neovereno: pocet("NEOVĚŘENO"),
    podleDruhu: [...new Set(radky.map((r) => r.druh))].sort((a, b) => a.localeCompare(b, "cs")),
  };
}

export async function seznamTerminu() {
  await zajistiVychoziData();
  return db.select().from(terminyZmeny).orderBy(asc(terminyZmeny.id));
}

/** Normy, které používá daný dokument (sloupec „Použití (šablony)“). */
export async function normyProDokument(klic: string) {
  const radky = await seznamNormy();
  return radky.filter((r) =>
    r.pouziti
      .split(/[,;]\s*/)
      .map((x) => x.trim())
      .filter(Boolean)
      .includes(klic),
  );
}

// ------------------------------------------------------------ e-mailové šablony

export async function seznamSablony() {
  await zajistiVychoziData();
  return db.select().from(emailSablony).orderBy(asc(emailSablony.poradi), asc(emailSablony.id));
}

export async function seznamZprav(limit = 50) {
  return db.select().from(emailZpravy).orderBy(desc(emailZpravy.createdAt)).limit(limit);
}

export async function seznamZpravZakazky(zakazkaId: number) {
  return db
    .select()
    .from(emailZpravy)
    .where(eq(emailZpravy.zakazkaId, zakazkaId))
    .orderBy(desc(emailZpravy.createdAt));
}

/** Zakázky, u kterých ještě není řádek v rejstříku — pro nabídku „doplnit“. */
export async function zakazkyBezEvidence() {
  const radky = await db
    .select({
      id: zakazky.id,
      cislo: zakazky.cislo,
      nazevStavby: zakazky.nazevStavby,
      zakaznik: zakazky.zakaznik,
    })
    .from(zakazky)
    .leftJoin(evidence, eq(evidence.zakazkaId, zakazky.id))
    .where(and(isNull(evidence.id), isNull(zakazky.smazanoAt)))
    .orderBy(asc(zakazky.cislo));
  return radky;
}