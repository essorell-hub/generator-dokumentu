/**
 * Výchozí obsah agendy — převzato z firemních souborů rev-02-2026 (audit 2026-10).
 *
 *   · Rejstřík norem a předpisů ....... Rejstrik_pouzitych_norem_rev-02-2026.xlsx
 *   · Termíny a změny ................. tamtéž, list „Termíny a změny“
 *
 * Slouží k prvnímu naplnění prázdné databáze. Jakmile uživatel cokoliv upraví,
 * jeho verze platí — výchozí data se znovu nepřepisují.
 */

export type VychoziNorma = {
  poradi: number;
  oznaceni: string;
  nazev: string;
  edice: string;
  druh: string;
  ucinnostOd: string;
  prechodneDo: string;
  pouziti: string;
  posledniOvereni: string;
  overil: string;
  stav: string;
  odkazOverit: string;
  poznamka: string;
};

export type VychoziTermin = {
  datum: string;
  co: string;
  dopad: string;
  odpovida: string;
  stav: string;
};

/** Rejstřík norem — 33 položek podle auditu z října 2026. */
export const VYCHOZI_NORMY: VychoziNorma[] = [
  {
    poradi: 1,
    oznaceni: "ČSN 33 2130 ed. 4",
    nazev: "Elektrické instalace nízkého napětí – Vnitřní elektrické rozvody",
    edice: "ed. 4 / 2024",
    druh: "ČSN",
    ucinnostOd: "1. 1. 2025",
    prechodneDo: "—",
    pouziti: "01, 04, 06",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná",
    odkazOverit: "https://agenturacas.gov.cz/?s=%C4%8CSN%2033%202130",
    poznamka: "nahrazuje ed. 3 (12/2014); nově parkování EV a fotovoltaika"
  },
  {
    poradi: 2,
    oznaceni: "ČSN 33 2000-4-41 ed. 3",
    nazev: "Ochrana před úrazem elektrickým proudem",
    edice: "ed. 3 + Z1, Z2",
    druh: "ČSN",
    ucinnostOd: "1. 2. 2018",
    prechodneDo: "—",
    pouziti: "01, 04, 06",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná",
    odkazOverit: "https://agenturacas.gov.cz/?s=%C4%8CSN%2033%202000-4-41",
    poznamka: "základní norma pro ochranu při poruše"
  },
  {
    poradi: 3,
    oznaceni: "ČSN 33 2000-5-51 ed. 3",
    nazev: "Výběr a stavba elektrických zařízení – Vnější vlivy",
    edice: "ed. 3 + Z1, Z2",
    druh: "ČSN",
    ucinnostOd: "—",
    prechodneDo: "—",
    pouziti: "N1, 01, 04",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná",
    odkazOverit: "https://agenturacas.gov.cz/?s=%C4%8CSN%2033%202000-5-51",
    poznamka: "podklad pro protokol o určení vnějších vlivů"
  },
  {
    poradi: 4,
    oznaceni: "TNI 33 2000-5-51",
    nazev: "Vnější vlivy – komentář k ČSN 33 2000-5-51",
    edice: "—",
    druh: "TNI",
    ucinnostOd: "—",
    prechodneDo: "—",
    pouziti: "N1",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná",
    odkazOverit: "https://agenturacas.gov.cz/?s=TNI%2033%202000-5-51",
    poznamka: "výkladová pomůcka, není závazná"
  },
  {
    poradi: 5,
    oznaceni: "ČSN 33 2000-5-54 ed. 3",
    nazev: "Uzemnění a ochranné vodiče",
    edice: "ed. 3",
    druh: "ČSN",
    ucinnostOd: "—",
    prechodneDo: "—",
    pouziti: "01, 06, N3",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná",
    odkazOverit: "https://agenturacas.gov.cz/?s=%C4%8CSN%2033%202000-5-54",
    poznamka: "uzemnění a pospojování"
  },
  {
    poradi: 6,
    oznaceni: "ČSN 33 2000-6 ed. 2",
    nazev: "Elektrické instalace nízkého napětí – Část 6: Revize",
    edice: "ed. 2 / 2017",
    druh: "ČSN",
    ucinnostOd: "—",
    prechodneDo: "—",
    pouziti: "01, 08, N8",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná",
    odkazOverit: "https://agenturacas.gov.cz/?s=%C4%8CSN%2033%202000-6",
    poznamka: "postup revizí a zkoušek"
  },
  {
    poradi: 7,
    oznaceni: "TNI 33 2000-6",
    nazev: "Revize – komentář k ČSN 33 2000-6",
    edice: "—",
    druh: "TNI",
    ucinnostOd: "1. 4. 2020",
    prechodneDo: "—",
    pouziti: "01, 08",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná",
    odkazOverit: "https://agenturacas.gov.cz/?s=TNI%2033%202000-6",
    poznamka: "—"
  },
  {
    poradi: 8,
    oznaceni: "ČSN 33 2000-7-701 ed. 3",
    nazev: "Prostory s vanou nebo sprchou",
    edice: "ed. 3 / 2025",
    druh: "ČSN",
    ucinnostOd: "1. 7. 2025",
    prechodneDo: "—",
    pouziti: "01, 04",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná",
    odkazOverit: "https://agenturacas.gov.cz/?s=%C4%8CSN%2033%202000-7-701",
    poznamka: "nové vydání — zkontrolovat u koupelen"
  },
  {
    poradi: 9,
    oznaceni: "ČSN 33 2000-7-712 ed. 2",
    nazev: "Fotovoltaické (PV) systémy",
    edice: "ed. 2 + Oprava 1",
    druh: "ČSN",
    ucinnostOd: "7/2023",
    prechodneDo: "—",
    pouziti: "04, 06, N8",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná",
    odkazOverit: "https://agenturacas.gov.cz/?s=%C4%8CSN%2033%202000-7-712",
    poznamka: "Oprava 1 upřesňuje chrániče typu B — u standardních střídačů není typ B nutný"
  },
  {
    poradi: 10,
    oznaceni: "ČSN 33 2000-7-722 ed. 3",
    nazev: "Napájení elektrických vozidel",
    edice: "ed. 3",
    druh: "ČSN",
    ucinnostOd: "1. 9. 2019",
    prechodneDo: "—",
    pouziti: "04, 11",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná",
    odkazOverit: "https://agenturacas.gov.cz/?s=%C4%8CSN%2033%202000-7-722",
    poznamka: "dobíjecí body"
  },
  {
    poradi: 11,
    oznaceni: "ČSN 33 1500",
    nazev: "Elektrotechnické předpisy – Revize elektrických zařízení",
    edice: "—",
    druh: "ČSN",
    ucinnostOd: "—",
    prechodneDo: "—",
    pouziti: "01, 08",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná",
    odkazOverit: "https://agenturacas.gov.cz/?s=%C4%8CSN%2033%201500",
    poznamka: "lhůty a rozsah revizí"
  },
  {
    poradi: 12,
    oznaceni: "ČSN EN 50174-1 ed. 3",
    nazev: "Informační technologie – Instalace kabeláže – Část 1",
    edice: "ed. 3",
    druh: "ČSN EN",
    ucinnostOd: "—",
    prechodneDo: "—",
    pouziti: "04, 11",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná",
    odkazOverit: "https://agenturacas.gov.cz/?s=%C4%8CSN%20EN%2050174-1",
    poznamka: "—"
  },
  {
    poradi: 13,
    oznaceni: "ČSN EN 50174-2 ed. 3",
    nazev: "Informační technologie – Instalace kabeláže – Část 2",
    edice: "ed. 3",
    druh: "ČSN EN",
    ucinnostOd: "—",
    prechodneDo: "—",
    pouziti: "04, 11",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná",
    odkazOverit: "https://agenturacas.gov.cz/?s=%C4%8CSN%20EN%2050174-2",
    poznamka: "—"
  },
  {
    poradi: 14,
    oznaceni: "ČSN EN 50174-3 ed. 2",
    nazev: "Informační technologie – Instalace kabeláže – Část 3",
    edice: "ed. 2",
    druh: "ČSN EN",
    ucinnostOd: "—",
    prechodneDo: "—",
    pouziti: "04",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná",
    odkazOverit: "https://agenturacas.gov.cz/?s=%C4%8CSN%20EN%2050174-3",
    poznamka: "venkovní kabeláž"
  },
  {
    poradi: 15,
    oznaceni: "ČSN EN IEC 62305-1 ed. 3",
    nazev: "Ochrana před bleskem – Část 1: Obecné principy",
    edice: "ed. 3 / 2025",
    druh: "ČSN EN IEC",
    ucinnostOd: "10/2025",
    prechodneDo: "31. 10. 2027",
    pouziti: "06, N2, N3",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná (přechod)",
    odkazOverit: "https://agenturacas.gov.cz/?s=%C4%8CSN%20EN%20IEC%2062305-1",
    poznamka: "ed. 2 platí souběžně; edici vždy deklarovat"
  },
  {
    poradi: 16,
    oznaceni: "ČSN EN IEC 62305-2 ed. 3",
    nazev: "Ochrana před bleskem – Část 2: Řízení rizika",
    edice: "ed. 3 / 2025",
    druh: "ČSN EN IEC",
    ucinnostOd: "10/2025",
    prechodneDo: "31. 10. 2027",
    pouziti: "N2, N3",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná (přechod)",
    odkazOverit: "https://agenturacas.gov.cz/?s=%C4%8CSN%20EN%20IEC%2062305-2",
    poznamka: "podklad pro analýzu rizika a třídu LPS"
  },
  {
    poradi: 17,
    oznaceni: "ČSN EN IEC 62305-3 ed. 3",
    nazev: "Ochrana před bleskem – Část 3: Hmotné škody na stavbách",
    edice: "ed. 3 / 2025",
    druh: "ČSN EN IEC",
    ucinnostOd: "10/2025",
    prechodneDo: "31. 10. 2027",
    pouziti: "06, N3",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná (přechod)",
    odkazOverit: "https://agenturacas.gov.cz/?s=%C4%8CSN%20EN%20IEC%2062305-3",
    poznamka: "jímací soustava, svody, uzemnění"
  },
  {
    poradi: 18,
    oznaceni: "ČSN EN IEC 62305-4 ed. 3",
    nazev: "Ochrana před bleskem – Část 4: Elektrické a elektronické systémy",
    edice: "ed. 3 / 2025",
    druh: "ČSN EN IEC",
    ucinnostOd: "10/2025",
    prechodneDo: "31. 10. 2027",
    pouziti: "06, N2, N3",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná (přechod)",
    odkazOverit: "https://agenturacas.gov.cz/?s=%C4%8CSN%20EN%20IEC%2062305-4",
    poznamka: "SPD a koordinace ochran"
  },
  {
    poradi: 19,
    oznaceni: "ČSN EN 62446-1 +A1",
    nazev: "Fotovoltaické systémy – Požadavky na zkoušky, dokumentaci a údržbu",
    edice: "—",
    druh: "ČSN EN",
    ucinnostOd: "—",
    prechodneDo: "—",
    pouziti: "N8, 06",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná",
    odkazOverit: "https://agenturacas.gov.cz/?s=%C4%8CSN%20EN%2062446-1",
    poznamka: "podklad pro protokol o zkouškách FVE"
  },
  {
    poradi: 20,
    oznaceni: "ČSN EN 50549-1",
    nazev: "Požadavky na paralelně připojené výrobny k distribuční síti",
    edice: "—",
    druh: "ČSN EN",
    ucinnostOd: "—",
    prechodneDo: "—",
    pouziti: "06, N8",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná",
    odkazOverit: "https://agenturacas.gov.cz/?s=%C4%8CSN%20EN%2050549-1",
    poznamka: "podmínky připojení výrobny"
  },
  {
    poradi: 21,
    oznaceni: "ČSN EN ISO 16484-1",
    nazev: "Systémy automatizace a řízení budov – Specifikace a provedení projektu",
    edice: "2024",
    druh: "ČSN EN ISO",
    ucinnostOd: "8/2024",
    prechodneDo: "—",
    pouziti: "03, 11",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná",
    odkazOverit: "https://agenturacas.gov.cz/?s=%C4%8CSN%20EN%20ISO%2016484-1",
    poznamka: "nahrazuje vydání 2011"
  },
  {
    poradi: 22,
    oznaceni: "ČSN EN ISO 52120-1",
    nazev: "Energetická náročnost budov – Přínos automatizace a řízení budov",
    edice: "11/2022",
    druh: "ČSN EN ISO",
    ucinnostOd: "—",
    prechodneDo: "—",
    pouziti: "03, 11",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná",
    odkazOverit: "https://agenturacas.gov.cz/?s=%C4%8CSN%20EN%20ISO%2052120-1",
    poznamka: "nahrazuje ČSN EN 15232-1"
  },
  {
    poradi: 23,
    oznaceni: "ČSN P 73 0847",
    nazev: "Požární bezpečnost staveb – Fotovoltaické (PV) systémy",
    edice: "—",
    druh: "ČSN P",
    ucinnostOd: "1. 6. 2024",
    prechodneDo: "—",
    pouziti: "06, N8",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná",
    odkazOverit: "https://agenturacas.gov.cz/?s=%C4%8CSN%20P%2073%200847",
    poznamka: "PBŘ povinné u každé FVE"
  },
  {
    poradi: 24,
    oznaceni: "ČSN 73 0848",
    nazev: "Požární bezpečnost staveb – Kabelové rozvody",
    edice: "2024",
    druh: "ČSN",
    ucinnostOd: "—",
    prechodneDo: "—",
    pouziti: "04, 06",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná",
    odkazOverit: "https://agenturacas.gov.cz/?s=%C4%8CSN%2073%200848",
    poznamka: "nová verze 2024"
  },
  {
    poradi: 25,
    oznaceni: "NV č. 190/2022 Sb.",
    nazev: "Vyhrazená technická elektrická zařízení a požadavky na jejich bezpečnost",
    edice: "—",
    druh: "nařízení vlády",
    ucinnostOd: "1. 7. 2022",
    prechodneDo: "—",
    pouziti: "01, 08, N1, N3, N6",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná",
    odkazOverit: "https://www.zakonyprolidi.cz/cs/2022-190",
    poznamka: "příl. 2 náležitosti revize, příl. 4 lhůty"
  },
  {
    poradi: 26,
    oznaceni: "Vyhláška č. 114/2023 Sb.",
    nazev: "Bezpečná instalace výrobny elektřiny z OZE do 50 kW",
    edice: "—",
    druh: "vyhláška",
    ucinnostOd: "1. 5. 2023",
    prechodneDo: "—",
    pouziti: "06, N8",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná",
    odkazOverit: "https://www.zakonyprolidi.cz/cs/2023-114",
    poznamka: "materiál, vypnutí, kabelové vedení"
  },
  {
    poradi: 27,
    oznaceni: "Vyhláška č. 131/2024 Sb.",
    nazev: "Dokumentace staveb",
    edice: "—",
    druh: "vyhláška",
    ucinnostOd: "1. 7. 2024",
    prechodneDo: "—",
    pouziti: "02, 03, 04, 05, 06, N4",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná",
    odkazOverit: "https://www.zakonyprolidi.cz/cs/2024-131",
    poznamka: "D.1.2.5 až D.1.2.10; § 329 NSZ"
  },
  {
    poradi: 28,
    oznaceni: "Vyhláška č. 146/2024 Sb.",
    nazev: "Požadavky na výstavbu",
    edice: "—",
    druh: "vyhláška",
    ucinnostOd: "—",
    prechodneDo: "—",
    pouziti: "04, 11",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná",
    odkazOverit: "https://www.zakonyprolidi.cz/cs/2024-146",
    poznamka: "dobíjecí body a kabelovody"
  },
  {
    poradi: 29,
    oznaceni: "Zákon č. 250/2021 Sb.",
    nazev: "Bezpečnost práce v souvislosti s provozem vyhrazených technických zařízení",
    edice: "—",
    druh: "zákon",
    ucinnostOd: "—",
    prechodneDo: "—",
    pouziti: "01, N8",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná",
    odkazOverit: "https://www.zakonyprolidi.cz/cs/2021-250",
    poznamka: "osvědčení revizního technika, platnost 5 let"
  },
  {
    poradi: 30,
    oznaceni: "Zákon č. 283/2021 Sb.",
    nazev: "Stavební zákon",
    edice: "novela od 1. 8. 2025",
    druh: "zákon",
    ucinnostOd: "1. 7. 2024",
    prechodneDo: "30. 6. 2027",
    pouziti: "02, 05, N7",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná (přechod)",
    odkazOverit: "https://www.zakonyprolidi.cz/cs/2021-283",
    poznamka: "§ 329 — přechodné ustanovení k dokumentacím"
  },
  {
    poradi: 31,
    oznaceni: "Zákon č. 264/2025 Sb.",
    nazev: "Kybernetická bezpečnost (transpozice NIS2)",
    edice: "—",
    druh: "zákon",
    ucinnostOd: "1. 11. 2025",
    prechodneDo: "—",
    pouziti: "03, 11, N8",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná",
    odkazOverit: "https://www.zakonyprolidi.cz/cs/2025-264",
    poznamka: "dálkový přístup a monitoring"
  },
  {
    poradi: 32,
    oznaceni: "Zákon č. 89/2012 Sb.",
    nazev: "Občanský zákoník",
    edice: "—",
    druh: "zákon",
    ucinnostOd: "—",
    prechodneDo: "—",
    pouziti: "10",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná",
    odkazOverit: "https://www.zakonyprolidi.cz/cs/2012-89",
    poznamka: "§ 2586 a násl. — smlouva o dílo"
  },
  {
    poradi: 33,
    oznaceni: "Zákon č. 235/2004 Sb.",
    nazev: "Daň z přidané hodnoty",
    edice: "—",
    druh: "zákon",
    ucinnostOd: "—",
    prechodneDo: "—",
    pouziti: "07, N4",
    posledniOvereni: "2026-10-07",
    overil: "audit 2026-10",
    stav: "platná",
    odkazOverit: "https://www.zakonyprolidi.cz/cs/2004-235",
    poznamka: "sazba DPH 21 %"
  }
];

/** Přechodná období a změny s dopadem na dokumentaci. */
export const VYCHOZI_TERMINY: VychoziTermin[] = [
  {
    datum: "1. 1. 2026",
    co: "Nové povinnosti automatizace a řízení budov nad ~290 kW",
    dopad: "Projekty MaR musí posoudit práh podle ČSN EN ISO 52120-1",
    odpovida: "[jméno]",
    stav: "[ ]"
  },
  {
    datum: "30. 6. 2027",
    co: "Přechodné období § 329 nového stavebního zákona",
    dopad: "Končí možnost používat dokumentaci podle vyhlášky č. 499/2006 Sb.",
    odpovida: "[jméno]",
    stav: "[ ]"
  },
  {
    datum: "31. 10. 2027",
    co: "Přechodné období ČSN EN IEC 62305 ed. 3",
    dopad: "Končí souběžná platnost ed. 2 — projekty podle ed. 2 bude nutné přepracovat",
    odpovida: "[jméno]",
    stav: "[ ]"
  },
  {
    datum: "průběžně",
    co: "Novely norem a vyhlášek ve Věstníku ÚNMZ",
    dopad: "Aktualizace rejstříku norem a dotčených šablon",
    odpovida: "[jméno]",
    stav: "[ ]"
  }
];
