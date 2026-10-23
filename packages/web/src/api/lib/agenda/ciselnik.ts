/**
 * Číselníky agendy — zdroj rozbalovacích seznamů v aplikaci i v exportovaných XLSX.
 * Odpovídá listu „Číselník“ v souboru 13_Evidence_zakazek_rev-02-2026.xlsx.
 */

export const TYPY_ZAKAZKY = ["FVE", "Elektro", "LPS", "MaR", "Revize", "Posudek", "Jiné"] as const;

export const STAVY_ZAKAZKY = [
  "Poptávka",
  "Nabídka",
  "Projekt",
  "Kontrola",
  "Předání",
  "Fakturováno",
  "Uzavřeno",
] as const;

export const ANO_NE = ["Ano", "Ne"] as const;

export const DRUHY_REVIZE = ["Výchozí", "Pravidelná", "Mimořádná"] as const;

export const STAVY_NORMY = ["platná", "platná (přechod)", "nahrazena", "zrušena"] as const;

export const DRUHY_NORMY = [
  "ČSN",
  "ČSN EN",
  "ČSN EN IEC",
  "ČSN EN ISO",
  "ČSN P",
  "TNI",
  "zákon",
  "vyhláška",
  "nařízení vlády",
] as const;

/** Lhůty revizí podle přílohy č. 4 NV č. 190/2022 Sb. */
export const LHUTY_REVIZI = [
  { dni: 183, delka: "0,5 roku", popis: "staveniště" },
  { dni: 365, delka: "1 rok", popis: "mokré a pojízdné prostory" },
  { dni: 731, delka: "2 roky", popis: "nad 200 osob, LPS kritické" },
  { dni: 1096, delka: "3 roky", popis: "výroba, ubytování, školy, požár a výbuch" },
  { dni: 1461, delka: "4 roky", popis: "LPS ostatní" },
  { dni: 1826, delka: "5 let", popis: "administrativa" },
] as const;

export function lhutaText(dni: number): string {
  const l = LHUTY_REVIZI.find((x) => x.dni === dni);
  return l ? `${l.delka} – ${l.popis}` : `${dni} dní`;
}

/** Popisky pro výběr lhůty v UI i v XLSX. */
export const LHUTY_MOZNOSTI = LHUTY_REVIZI.map((l) => ({
  hodnota: l.dni,
  popisek: `${l.delka} – ${l.popis}`,
}));

/** Sloupec „Použití (šablony)“ — které dokumenty normu používají. */
export const KLICE_DOKUMENTU = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
  "N1",
  "N2",
  "N3",
  "N4",
  "N5",
  "N6",
  "N7",
  "N8",
  "N9",
] as const;