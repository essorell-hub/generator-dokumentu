/**
 * Napojení šablon dokumentů na rejstřík norem.
 *
 * Šablony citují normy přímým textem (např. „ČSN 33 2000-6 ed. 2").
 * Tato vrstva při generování nahradí každou citaci aktuálním označením
 * z rejstříku — stačí tedy změnit označení v rejstříku a všechny
 * dokumenty ho při příštím generování převezmou automaticky.
 *
 * Pravidla:
 *  - Párování je deterministické: jedna citace → jedno označení z rejstříku.
 *  - Pokud označení v rejstříku chybí nebo nenajde citaci, šablona se
 *    beze změny generuje dál (bezpečný fallback).
 *  - Funkce je synchronní a nezávisí na síti.
 */
import type { Rule } from "./docx";

/** Jedna položka rejstříku norem relevantní pro generování. */
export interface NormaProGenerovani {
  oznaceni: string;
}

/**
 * Mapa: text v šabloně → klíč označení v rejstříku.
 *
 * Šablony používají zkrácené citace (bez edice), starší názvy a různé
 * varianty zápisu. Tato tabulka je překlenovacím mostem — upravuje se
 * ručně, když se šablona nebo rejstřík změní.
 */
export const PAROVANI_NOREM: Record<string, string> = {
  // ČSN 33 2130
  "ČSN 33 2130 ed. 4":            "ČSN 33 2130 ed. 4",
  "ČSN 33 2130 ed.4":             "ČSN 33 2130 ed. 4",
  "ČSN 33 2130":                  "ČSN 33 2130 ed. 4",
  // ČSN 33 2000-4-41
  "ČSN 33 2000-4-41 ed. 3":       "ČSN 33 2000-4-41 ed. 3",
  "ČSN 33 2000-4-41":             "ČSN 33 2000-4-41 ed. 3",
  // ČSN 33 2000-5-51
  "ČSN 33 2000-5-51 ed. 3":       "ČSN 33 2000-5-51 ed. 3",
  "ČSN 33 2000-5-51":             "ČSN 33 2000-5-51 ed. 3",
  "TNI 33 2000-5-51":             "TNI 33 2000-5-51",
  // ČSN 33 2000-5-54
  "ČSN 33 2000-5-54 ed. 3":       "ČSN 33 2000-5-54 ed. 3",
  "ČSN 33 2000-5-54":             "ČSN 33 2000-5-54 ed. 3",
  // ČSN 33 2000-6
  "ČSN 33 2000-6 ed. 2":          "ČSN 33 2000-6 ed. 2",
  "ČSN 33 2000-6":                "ČSN 33 2000-6 ed. 2",
  "TNI 33 2000-6":                "TNI 33 2000-6",
  // ČSN 33 2000-7-701
  "ČSN 33 2000-7-701 ed. 3":      "ČSN 33 2000-7-701 ed. 3",
  "ČSN 33 2000-7-701":            "ČSN 33 2000-7-701 ed. 3",
  // ČSN 33 2000-7-712
  "ČSN 33 2000-7-712 ed. 2":      "ČSN 33 2000-7-712 ed. 2",
  "ČSN 33 2000-7-712":            "ČSN 33 2000-7-712 ed. 2",
  // ČSN 33 2000-7-722
  "ČSN 33 2000-7-722 ed. 3":      "ČSN 33 2000-7-722 ed. 3",
  "ČSN 33 2000-7-722":            "ČSN 33 2000-7-722 ed. 3",
  // ČSN 33 1500
  "ČSN 33 1500":                  "ČSN 33 1500",
  // ČSN EN 50174
  "ČSN EN 50174-1 ed. 3":         "ČSN EN 50174-1 ed. 3",
  "ČSN EN 50174-2 ed. 3":         "ČSN EN 50174-2 ed. 3",
  "ČSN EN 50174-3 ed. 2":         "ČSN EN 50174-3 ed. 2",
  "ČSN EN 50174":                 "ČSN EN 50174-1 ed. 3",
  // ČSN EN IEC 62305 (ochrana před bleskem) — starší citace bez „IEC"
  "ČSN EN IEC 62305-1 ed. 3":     "ČSN EN IEC 62305-1 ed. 3",
  "ČSN EN IEC 62305-2 ed. 3":     "ČSN EN IEC 62305-2 ed. 3",
  "ČSN EN IEC 62305-3 ed. 3":     "ČSN EN IEC 62305-3 ed. 3",
  "ČSN EN IEC 62305-4 ed. 3":     "ČSN EN IEC 62305-4 ed. 3",
  "ČSN EN IEC 62305-1":           "ČSN EN IEC 62305-1 ed. 3",
  "ČSN EN IEC 62305-2":           "ČSN EN IEC 62305-2 ed. 3",
  "ČSN EN IEC 62305-3":           "ČSN EN IEC 62305-3 ed. 3",
  "ČSN EN IEC 62305-4":           "ČSN EN IEC 62305-4 ed. 3",
  "ČSN EN 62305-1":               "ČSN EN IEC 62305-1 ed. 3",
  "ČSN EN 62305-2":               "ČSN EN IEC 62305-2 ed. 3",
  "ČSN EN 62305-3":               "ČSN EN IEC 62305-3 ed. 3",
  "ČSN EN 62305-4":               "ČSN EN IEC 62305-4 ed. 3",
  // ČSN EN 62446-1
  "ČSN EN 62446-1 +A1":           "ČSN EN 62446-1 +A1",
  "ČSN EN 62446-1":               "ČSN EN 62446-1 +A1",
  // ČSN EN 50549-1
  "ČSN EN 50549-1":               "ČSN EN 50549-1",
  // ČSN EN ISO 16484
  "ČSN EN ISO 16484-1":           "ČSN EN ISO 16484-1",
  "ISO 16484-1":                  "ČSN EN ISO 16484-1",
  "ISO 16484-3":                  "ČSN EN ISO 16484-1",
  // ČSN EN ISO 52120
  "ČSN EN ISO 52120-1":           "ČSN EN ISO 52120-1",
  "ISO 52120-1":                  "ČSN EN ISO 52120-1",
  // ČSN P 73 0847, ČSN 73 0848
  "ČSN P 73 0847":                "ČSN P 73 0847",
  "ČSN 73 0848":                  "ČSN 73 0848",
};

/**
 * Sestaví pravidla pro nahrazení označení norem v dokumentu.
 *
 * Pouze citace, jejichž aktuální označení se od textu v šabloně liší,
 * dostanou pravidlo — zbylé se nechají být (šetří výkon a zabraňuje
 * nechtěnému přepsání komentářů u norem, kde se mění edice vědomě).
 *
 * @param rejstrik   Všechny aktivní normy z databáze (pole objektů s `oznaceni`).
 * @returns          Pole pravidel Rule, prázdné pokud se nic nezměnilo.
 */
export function normyRules(rejstrik: NormaProGenerovani[]): Rule[] {
  const aktualniOznaceni = new Set(rejstrik.map((n) => n.oznaceni));
  const rules: Rule[] = [];

  for (const [citaceVSablone, klic] of Object.entries(PAROVANI_NOREM)) {
    // Cílová norma musí být v rejstříku (může být dočasně odebrána).
    if (!aktualniOznaceni.has(klic)) continue;
    // Nahrazení má smysl jen tehdy, pokud se označení liší od citace.
    if (citaceVSablone === klic) continue;

    rules.push({ match: citaceVSablone, value: klic });
  }

  return rules;
}
