/**
 * Kontrolní mechanismus úplnosti zakázky a logických vazeb mezi údaji.
 *
 * Provádí formální a věcnou kontrolu vyplnění povinných polí, souladu údajů
 * a návazností na provozní agendu (měřidla, odborná způsobilost)
 * podle vybraných typů dokumentů.
 *
 * DŮLEŽITÉ UPOZORNĚNÍ:
 * Tato kontrola ověřuje administrativní a věcnou úplnost podkladů. Nenahrazuje
 * odborné technické posouzení stavby ani certifikaci shody s technickými
 * normami autorizovanou osobou.
 */

import type { Firma, Zakazka } from "./docgen/map";
import type { Doplnky } from "./docgen/nove/doplnky";

export type Zavaznost = "kriticka" | "varovani" | "rozpor" | "info";

export interface PolozkaKontroly {
  kod: string;
  zavaznost: Zavaznost;
  pole?: string;
  dokumentKlic?: string;
  zprava: string;
  doporuceni: string;
}

export interface VysledekKontrolyUplnosti {
  celkovyStav: "v_poradku" | "varovani" | "neuplne";
  polozky: PolozkaKontroly[];
  pocetKritickych: number;
  pocetVarovani: number;
  pocetRozporu: number;
  prohlaseni: string;
}

const UPOZORNENI_PROHLASENI =
  "Kontrola ověřuje administrativní a věcnou úplnost podkladů a logické vazby mezi údaji zakázky. " +
  "Nenahrazuje odborné technické posouzení vyhrazeného elektrického zařízení revizním technikem ani autorizovaným projektantem.";

function jeVyplneno(val: unknown): boolean {
  return typeof val === "string" && val.trim().length > 0;
}

function parseDatum(val: string): Date | null {
  if (!val || !val.trim()) return null;
  const d = new Date(val.trim());
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Zkontroluje úplnost podkladů a logické vazby pro danou zakázku a vybrané dokumenty.
 */
export function zkontrolujUplnostZakazky(
  zakazka: Zakazka,
  firma: Firma,
  vybraneKlice: string[] = [],
  doplnky?: Doplnky,
): VysledekKontrolyUplnosti {
  const polozky: PolozkaKontroly[] = [];

  // =========================================================================
  // 1. ZÁKLADNÍ IDENTIFIKAČNÍ POVINNÉ ÚDAJE (společné pro všechny zakázky)
  // =========================================================================

  if (!jeVyplneno(zakazka.cislo)) {
    polozky.push({
      kod: "CHYBI_CISLO_ZAKAZKY",
      zavaznost: "kriticka",
      pole: "cislo",
      zprava: "Chybí číslo zakázky.",
      doporuceni: "Doplňte číslo zakázky ve formátu RRRR-NNN.",
    });
  }

  if (!jeVyplneno(zakazka.nazevStavby)) {
    polozky.push({
      kod: "CHYBI_NAZEV_STAVBY",
      zavaznost: "kriticka",
      pole: "nazevStavby",
      zprava: "Chybí název stavby.",
      doporuceni: "Vyplňte oficiální název stavby pro záhlaví dokumentace.",
    });
  }

  if (!jeVyplneno(zakazka.investor) && !jeVyplneno(zakazka.zakaznik)) {
    polozky.push({
      kod: "CHYBI_INVESTOR_NEBO_OBJEDNATEL",
      zavaznost: "kriticka",
      pole: "investor",
      zprava: "Není vyplněn investor ani zákazník (objednatel).",
      doporuceni: "Doplňte identifikační údaje investora stavby nebo objednatele.",
    });
  }

  if (!jeVyplneno(zakazka.datum)) {
    polozky.push({
      kod: "CHYBI_DATUM_ZAKAZKY",
      zavaznost: "varovani",
      pole: "datum",
      zprava: "Není vyplněno datum zakázky.",
      doporuceni: "Nastavte datum vyhotovení dokumentace.",
    });
  }

  // =========================================================================
  // 2. KONTROLA SPECIFICKÝCH ÚDAJŮ PODLE VYBRANÝCH DOKUMENTŮ
  // =========================================================================

  const maDokument = (klic: string) => vybraneKlice.includes(klic);
  const maJakukoliv = (...klice: string[]) => klice.some((k) => vybraneKlice.includes(k));

  // A) Revizní zprávy (01 - Elektroinstalace, N3 - LPS, P7 - Výchozí revize, P9 - Spotřebiče)
  const vyzadujeRevizi = maJakukoliv("01", "N3", "P7", "P9");
  if (vyzadujeRevizi) {
    if (!jeVyplneno(zakazka.elektroTechnikJmeno)) {
      polozky.push({
        kod: "REVIZE_CHYBI_TECHNIK",
        zavaznost: "kriticka",
        pole: "elektroTechnikJmeno",
        dokumentKlic: "01",
        zprava: "Pro revizní zprávu není uveden revizní technik.",
        doporuceni: "Vyplňte jméno revizního technika v údajích zakázky nebo jej vyberte z evidence osob.",
      });
    }

    if (!jeVyplneno(zakazka.datumMistnihoSetreni)) {
      polozky.push({
        kod: "REVIZE_CHYBI_DATUM_SETRENI",
        zavaznost: "varovani",
        pole: "datumMistnihoSetreni",
        dokumentKlic: "01",
        zprava: "Není uvedeno datum místního šetření / provedení revize.",
        doporuceni: "Doplňte datum, kdy revizní technik provedl prohlídku a měření na místě.",
      });
    }

    if (!jeVyplneno(zakazka.datumPristiRevize)) {
      polozky.push({
        kod: "REVIZE_CHYBI_PRISTI_TERMIN",
        zavaznost: "varovani",
        pole: "datumPristiRevize",
        dokumentKlic: "01",
        zprava: "Není stanovena doporučená lhůta příští pravidelné revize.",
        doporuceni: "Doplňte termín příští revize podle přílohy č. 4 NV č. 190/2022 Sb.",
      });
    }

    // Měřidla pro revize
    if (doplnky) {
      const aktivniMeridla = doplnky.meridla.filter((m) => m.aktivni);
      if (aktivniMeridla.length === 0) {
        polozky.push({
          kod: "REVIZE_CHYBI_MERIDLA",
          zavaznost: "varovani",
          dokumentKlic: "01",
          zprava: "V provozní agendě nejsou evidována žádná aktivní měřidla pro revize.",
          doporuceni: "Zkontrolujte v sekci Provoz evidenci měřicích přístrojů (§ 10 odst. 1 písm. g) NV 190).",
        });
      } else {
        const proslaMeridla = aktivniMeridla.filter((m) => {
          if (!m.kalibraceDatum) return false;
          const kDatum = parseDatum(m.kalibraceDatum);
          if (!kDatum) return false;
          const interval = m.intervalMesicu || 12;
          const platnostDo = new Date(kDatum);
          platnostDo.setMonth(platnostDo.getMonth() + interval);
          return platnostDo < new Date();
        });
        if (proslaMeridla.length > 0) {
          polozky.push({
            kod: "REVIZE_PROSLA_KALIBRACE",
            zavaznost: "rozpor",
            dokumentKlic: "01",
            zprava: `Některá evidovaná měřidla mají prošlou kalibraci (${proslaMeridla.map((m) => m.nazev).join(", ")}).`,
            doporuceni: "Aktualizujte data kalibrace v evidenci měřidel před vyhotovením revizní zprávy.",
          });
        }
      }
    }
  }

  // B) Technické zprávy projektu (02 - Průvodní list, 03 - MaR, 04 - Silnoproud, 05 - Titulní list)
  const vyzadujeProjektanta = maJakukoliv("02", "03", "04", "05");
  if (vyzadujeProjektanta) {
    if (!jeVyplneno(zakazka.projektantJmeno) && !jeVyplneno(zakazka.zpracovatelJmeno)) {
      polozky.push({
        kod: "PROJEKT_CHYBI_PROJEKTANT",
        zavaznost: "varovani",
        pole: "projektantJmeno",
        dokumentKlic: "04",
        zprava: "Pro projektovou dokumentaci není uveden projektant ani zpracovatel.",
        doporuceni: "Doplňte jméno odpovědného projektanta a číslo autorizace ČKAIT.",
      });
    }

    if (!jeVyplneno(zakazka.adresaStavby)) {
      polozky.push({
        kod: "PROJEKT_CHYBI_ADRESA_STAVBY",
        zavaznost: "varovani",
        pole: "adresaStavby",
        dokumentKlic: "02",
        zprava: "Není vyplněna adresa stavby.",
        doporuceni: "Doplňte adresu místa stavby pro průvodní list a technické zprávy.",
      });
    }
  }

  // C) Silnoproud (04)
  if (maDokument("04")) {
    if (!jeVyplneno(zakazka.jistic)) {
      polozky.push({
        kod: "SILNOPROUD_CHYBI_JISTIC",
        zavaznost: "varovani",
        pole: "jistic",
        dokumentKlic: "04",
        zprava: "Není specifikována hodnota hlavního jističe.",
        doporuceni: "Doplňte jmenovitý proud hlavního jističe (např. 25 A / 3f).",
      });
    }
  }

  // D) Fotovoltaické elektrárny (06 - TZ FVE a LPS, N6 - Provozní řád FVE)
  const vyzadujeFve = maJakukoliv("06", "N6");
  if (vyzadujeFve) {
    if (!jeVyplneno(zakazka.vykonFve)) {
      polozky.push({
        kod: "FVE_CHYBI_VYKON",
        zavaznost: "varovani",
        pole: "vykonFve",
        dokumentKlic: "06",
        zprava: "U dokumentace pro FVE není vyplněn instalovaný výkon FVE.",
        doporuceni: "Doplňte špičkový výkon výrobny v kWp (např. 9.8 kWp).",
      });
    }
  }

  // E) Obchodní dokumenty (07 - Nabídka, 10 - Smlouva o dílo)
  const vyzadujeObchod = maJakukoliv("07", "10");
  if (vyzadujeObchod) {
    if (!jeVyplneno(zakazka.zakaznik)) {
      polozky.push({
        kod: "OBCHOD_CHYBI_ZAKAZNIK",
        zavaznost: "kriticka",
        pole: "zakaznik",
        dokumentKlic: "07",
        zprava: "Pro nabídku nebo smlouvu o dílo není specifikován objednatel / zákazník.",
        doporuceni: "Doplňte název a identifikační údaje zákazníka.",
      });
    }

    if (!jeVyplneno(zakazka.zakaznikIco)) {
      polozky.push({
        kod: "OBCHOD_CHYBI_ICO",
        zavaznost: "varovani",
        pole: "zakaznikIco",
        dokumentKlic: "10",
        zprava: "Pro smlouvu o dílo není vyplněno IČO zákazníka.",
        doporuceni: "Doplňte IČO objednatele pro identifikaci smluvní strany.",
      });
    }
  }

  // F) Podklady TIČR pro I. třídu (P8)
  if (maDokument("P8")) {
    if (doplnky) {
      const maOsobuE1 = doplnky.osoby.some(
        (o) => o.aktivni && o.stupen === "revizní technik" && o.rozsah.toUpperCase().includes("E1"),
      );
      if (!maOsobuE1 && !zakazka.elektroTechnikAutorizace) {
        polozky.push({
          kod: "TICR_CHYBI_ROZSAH_E1",
          zavaznost: "varovani",
          dokumentKlic: "P8",
          zprava: "Pro zařízení I. třídy (P8) nebyl v evidenci nalezen revizní technik s rozsahem E1.",
          doporuceni: "Ověřte, zda revizní technik disponuje osvědčením pro zařízení I. třídy (rozsah E1).",
        });
      }
    }
  }

  // =========================================================================
  // 3. LOGICKÉ ROZPORY MEZI ÚDAJI (Inconsistencies)
  // =========================================================================

  // A) Datum příští revize nesmí předcházet datu místního šetření
  if (jeVyplneno(zakazka.datumMistnihoSetreni) && jeVyplneno(zakazka.datumPristiRevize)) {
    const setreni = parseDatum(zakazka.datumMistnihoSetreni);
    const pristi = parseDatum(zakazka.datumPristiRevize);
    if (setreni && pristi && pristi < setreni) {
      polozky.push({
        kod: "ROZPOR_DATUM_REVIZE",
        zavaznost: "rozpor",
        pole: "datumPristiRevize",
        zprava: "Datum příští revize je dřívější než datum místního šetření.",
        doporuceni: "Zkontrolujte data revize; datum příští revize musí následovat po místním šetření.",
      });
    }
  }

  // B) Formát IČO (pokud je vyplněno, má mít 8 číslic)
  const zkontrolujIco = (ico: string, pole: string, subjekt: string) => {
    if (!jeVyplneno(ico)) return;
    const ciste = ico.trim().replace(/\s+/g, "");
    if (!/^\d{8}$/.test(ciste)) {
      polozky.push({
        kod: `NEPLATNE_ICO_${subjekt.toUpperCase()}`,
        zavaznost: "varovani",
        pole,
        zprava: `IČO ${subjekt} má neobvyklý formát (${ico}). Běžné IČO má 8 číslic.`,
        doporuceni: "Ověřte správnost IČO v registru ARES.",
      });
    }
  };

  zkontrolujIco(zakazka.investorIco, "investorIco", "investora");
  zkontrolujIco(zakazka.zakaznikIco, "zakaznikIco", "zákazníka");

  // =========================================================================
  // 4. VYHODNOCENÍ CELKOVÉHO STAVU
  // =========================================================================

  const pocetKritickych = polozky.filter((p) => p.zavaznost === "kriticka").length;
  const pocetRozporu = polozky.filter((p) => p.zavaznost === "rozpor").length;
  const pocetVarovani = polozky.filter((p) => p.zavaznost === "varovani").length;

  let celkovyStav: VysledekKontrolyUplnosti["celkovyStav"] = "v_poradku";
  if (pocetKritickych > 0 || pocetRozporu > 0) {
    celkovyStav = "neuplne";
  } else if (pocetVarovani > 0) {
    celkovyStav = "varovani";
  }

  return {
    celkovyStav,
    polozky,
    pocetKritickych,
    pocetVarovani,
    pocetRozporu,
    prohlaseni: UPOZORNENI_PROHLASENI,
  };
}
