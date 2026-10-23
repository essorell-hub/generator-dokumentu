/**
 * Registr dokumentů, které se neskládají ze schválené šablony, ale generují
 * se přímo (knihovna `docx`). Doplňují sadu šablon o provozní, revizní
 * a personální dokumentaci podle zákona č. 250/2021 Sb. a NV č. 190/2022
 * a 194/2022 Sb.
 */
import type { Firma, Zakazka } from "../map";
import type { Moznosti } from "./doplnky";
import {
  povereniOdpovedneOsoby,
  radProhlidek,
  stanoveniVedoucihoPrace,
  vyhodnoceniRizika,
  zapisOopp,
  zapisPouceni,
} from "./provoz";
import {
  podkladyOsvedceniI,
  provozniDenik,
  revizeSpotrebicu,
  souhrnnaZprava,
  zaznamSkoleni,
} from "./revize";
import type { VysledekNoveho } from "./styl";

export type { Doplnky, Moznosti } from "./doplnky";
export type { VysledekNoveho } from "./styl";

export interface NovyDef {
  klic: string;
  nazev: string;
  popis: string;
  slug: string;
  revize: string;
  /** Právní opora — zobrazuje se v katalogu. */
  predpis: string;
  generuj: (z: Zakazka, f: Firma, o: Moznosti) => Promise<VysledekNoveho>;
}

const REV = "rev-01-2026";

export const NOVE: NovyDef[] = [
  {
    klic: "P1",
    nazev: "Řád prohlídek, údržby a revizí",
    popis: "Úkony, intervaly, evidence a lhůty revizí podle přílohy č. 4",
    slug: "Rad_prohlidek_udrzby_a_revizi",
    revize: REV,
    predpis: "§ 7 odst. 5 NV 190/2022 Sb.",
    generuj: radProhlidek,
  },
  {
    klic: "P2",
    nazev: "Pověření osoby odpovědné za elektrické zařízení",
    popis: "Písemné pověření provozovatele",
    slug: "Povereni_odpovedne_osoby",
    revize: REV,
    predpis: "§ 8 písm. d) NV 190/2022 Sb.",
    generuj: povereniOdpovedneOsoby,
  },
  {
    klic: "P3",
    nazev: "Zápis o vyhodnocení elektrického rizika",
    popis: "Před zahájením práce nebo obsluhy",
    slug: "Vyhodnoceni_elektrickeho_rizika",
    revize: REV,
    predpis: "§ 8 písm. b) NV 190/2022 Sb.",
    generuj: vyhodnoceniRizika,
  },
  {
    klic: "P4",
    nazev: "Stanovení vedoucího práce",
    popis: "Rozbor složitosti práce a složení skupiny",
    slug: "Stanoveni_vedouciho_prace",
    revize: REV,
    predpis: "§ 8 písm. e) NV 190/2022 Sb.",
    generuj: stanoveniVedoucihoPrace,
  },
  {
    klic: "P5",
    nazev: "Zápis o seznámení s OOPP",
    popis: "Vydané ochranné prostředky a seznámení s jejich používáním",
    slug: "Zapis_o_seznameni_s_OOPP",
    revize: REV,
    predpis: "§ 7 odst. 6 NV 190/2022 Sb.",
    generuj: zapisOopp,
  },
  {
    klic: "P6",
    nazev: "Zápis o poučení a ověření znalostí osoby poučené",
    popis: "Rozsah poučení a specifikace pracovišť",
    slug: "Zapis_o_pouceni_osoby_poucene",
    revize: REV,
    predpis: "§ 4 odst. 3 NV 194/2022 Sb.",
    generuj: zapisPouceni,
  },
  {
    klic: "P7",
    nazev: "Souhrnná zpráva o výchozí revizi",
    popis: "Když se zařízení reviduje po částech",
    slug: "Souhrnna_zprava_o_vychozi_revizi",
    revize: REV,
    predpis: "§ 10 odst. 2 NV 190/2022 Sb.",
    generuj: souhrnnaZprava,
  },
  {
    klic: "P8",
    nazev: "Podklady k žádosti o osvědčení VEZ I. třídy",
    popis: "Údaje do žádosti TIČR a soupis podkladů pro šetření",
    slug: "Podklady_osvedceni_VEZ_I_tridy",
    revize: REV,
    predpis: "§ 6 odst. 6 NV 190/2022 Sb.",
    generuj: podkladyOsvedceniI,
  },
  {
    klic: "P9",
    nazev: "Zpráva o revizi spotřebičů a ručního nářadí",
    popis: "Seznam spotřebičů, měření a závěr",
    slug: "Revize_spotrebicu_a_naradi",
    revize: REV,
    predpis: "ČSN 33 1600 ed. 2",
    generuj: revizeSpotrebicu,
  },
  {
    klic: "P10",
    nazev: "Záznam o školení a ověření znalostí",
    popis: "Pravidelné školení osob znalých z evidence osob",
    slug: "Zaznam_o_skoleni",
    revize: REV,
    predpis: "§ 3 odst. 4 NV 194/2022 Sb.",
    generuj: zaznamSkoleni,
  },
  {
    klic: "P11",
    nazev: "Provozní deník elektrického zařízení",
    popis: "Záznamy o prohlídkách, zkouškách, údržbě a závadách",
    slug: "Provozni_denik",
    revize: REV,
    predpis: "§ 7 odst. 5 písm. c) NV 190/2022 Sb.",
    generuj: provozniDenik,
  },
];

export function novyByKlic(klic: string): NovyDef | undefined {
  return NOVE.find((d) => d.klic === klic);
}
