/**
 * Veřejné rozhraní generátoru.
 *
 * Dvě cesty:
 *  - dokumenty ze schválených šablon (`DOCS`) — šablona + pravidla náhrad,
 *  - nové dokumenty (`NOVE`) — generované přímo, s údaji z provozní agendy.
 */
import { fillDocx } from "./docx";
import {
  DOCS,
  docByKlic,
  fileNameFor,
  templateBytes,
  type DocDef,
  type Firma,
  type Zakazka,
} from "./map";
import { NOVE, novyByKlic, type Doplnky } from "./nove";
import { PRAZDNE_DOPLNKY } from "./nove/doplnky";

export { DOCS, NOVE, docByKlic, fileNameFor, type DocDef, type Doplnky, type Firma, type Zakazka };

export interface VysledekDokumentu {
  klic: string;
  nazev: string;
  nazevSouboru: string;
  revize: string;
  data: Uint8Array;
  nevyplneno: string[];
}

export interface PolozkaKatalogu {
  klic: string;
  nazev: string;
  popis: string;
  revize: string;
  /** „projekt“ = šablony projektu a revize, „provoz“ = provozní a personální dokumentace. */
  skupina: "projekt" | "provoz";
  predpis: string;
}

export interface MoznostiGenerovani {
  highlight?: boolean;
  doplnky?: Doplnky;
}

/** Všechny dokumenty, které aplikace umí vytvořit — pořadí odpovídá katalogu. */
export function vsechnyKlice(): string[] {
  return [...DOCS.map((d) => d.klic), ...NOVE.map((d) => d.klic)];
}

export function docCatalog(): PolozkaKatalogu[] {
  return [
    ...DOCS.map((d) => ({ klic: d.klic, nazev: d.nazev, popis: d.popis, revize: d.revize, skupina: "projekt" as const, predpis: "" })),
    ...NOVE.map((d) => ({ klic: d.klic, nazev: d.nazev, popis: d.popis, revize: d.revize, skupina: "provoz" as const, predpis: d.predpis })),
  ];
}

export function generujDokument(
  doc: DocDef,
  zakazka: Zakazka,
  firma: Firma,
  options: MoznostiGenerovani = {},
): VysledekDokumentu {
  const { data, unresolved } = fillDocx(templateBytes(doc), {
    rules: doc.rules(zakazka, firma, options.doplnky ?? PRAZDNE_DOPLNKY),
    highlight: options.highlight !== false,
    meta: {
      title: `${doc.nazev} — ${zakazka.nazevStavby || zakazka.cislo}`,
      creator: firma.nazev,
    },
  });
  return {
    klic: doc.klic,
    nazev: doc.nazev,
    nazevSouboru: fileNameFor(doc, zakazka),
    revize: doc.revize,
    data,
    nevyplneno: unresolved,
  };
}

export async function generujPodleKlice(
  klic: string,
  zakazka: Zakazka,
  firma: Firma,
  options: MoznostiGenerovani = {},
): Promise<VysledekDokumentu> {
  const doc = docByKlic(klic);
  if (doc) return generujDokument(doc, zakazka, firma, options);
  const novy = novyByKlic(klic);
  if (!novy) throw new Error(`Neznámý dokument: ${klic}`);
  const { data, nevyplneno } = await novy.generuj(zakazka, firma, {
    zvyraznit: options.highlight !== false,
    doplnky: options.doplnky ?? PRAZDNE_DOPLNKY,
  });
  return {
    klic: novy.klic,
    nazev: novy.nazev,
    nazevSouboru: fileNameFor(novy, zakazka),
    revize: novy.revize,
    data,
    nevyplneno,
  };
}

/** Nevyplněná místa bez uložení souboru — pro kontrolu před generováním. */
export async function zkontroluj(
  klic: string,
  zakazka: Zakazka,
  firma: Firma,
  doplnky?: Doplnky,
): Promise<{ klic: string; nazev: string; nevyplneno: string[] }> {
  const vysledek = await generujPodleKlice(klic, zakazka, firma, { highlight: false, doplnky });
  return { klic: vysledek.klic, nazev: vysledek.nazev, nevyplneno: vysledek.nevyplneno };
}
