import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/** Zakázka — jeden záznam na jednu stavbu, ze kterého se generuje sada dokumentů. */
export const zakazky = sqliteTable("zakazky", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Identifikace
  cislo: text("cislo").notNull(),
  revize: text("revize").notNull().default("00"),
  nazevStavby: text("nazev_stavby").notNull().default(""),
  nazevObjektu: text("nazev_objektu").notNull().default(""),
  poznamka: text("poznamka").notNull().default(""),
  stav: text("stav").notNull().default("rozpracovana"),

  // Místo
  adresaStavby: text("adresa_stavby").notNull().default(""),
  parcela: text("parcela").notNull().default(""),
  katastr: text("katastr").notNull().default(""),
  kraj: text("kraj").notNull().default(""),

  // Charakter dokumentace
  typStavby: text("typ_stavby").notNull().default(""),
  stupenDokumentace: text("stupen_dokumentace").notNull().default("dokumentace pro povolení stavby"),
  castDokumentace: text("cast_dokumentace").notNull().default("D.1.2.5 TPS – Silnoproud"),
  prilohaVyhlasky: text("priloha_vyhlasky").notNull().default("1"),
  profese: text("profese").notNull().default("ELEKTROINSTALACE / FVE / LPS / MaR"),

  // Investor
  investor: text("investor").notNull().default(""),
  investorAdresa: text("investor_adresa").notNull().default(""),
  investorIco: text("investor_ico").notNull().default(""),
  investorDic: text("investor_dic").notNull().default(""),
  investorZastupce: text("investor_zastupce").notNull().default(""),

  // Objednatel / zákazník (smlouva, nabídka)
  zakaznik: text("zakaznik").notNull().default(""),
  zakaznikAdresa: text("zakaznik_adresa").notNull().default(""),
  zakaznikIco: text("zakaznik_ico").notNull().default(""),
  zakaznikDic: text("zakaznik_dic").notNull().default(""),
  zakaznikZastupce: text("zakaznik_zastupce").notNull().default(""),
  zakaznikKontakt: text("zakaznik_kontakt").notNull().default(""),

  // Osoby
  projektantJmeno: text("projektant_jmeno").notNull().default(""),
  projektantAutorizace: text("projektant_autorizace").notNull().default(""),
  projektantObor: text("projektant_obor").notNull().default(""),
  projektantSpecializace: text("projektant_specializace").notNull().default(""),
  zpracovatelJmeno: text("zpracovatel_jmeno").notNull().default(""),
  elektroTechnikJmeno: text("elektro_technik_jmeno").notNull().default(""),
  elektroTechnikAutorizace: text("elektro_technik_autorizace").notNull().default(""),

  // Termíny
  datum: text("datum").notNull().default(""),
  datumMistnihoSetreni: text("datum_mistniho_setreni").notNull().default(""),
  datumPristiRevize: text("datum_pristi_revize").notNull().default(""),

  // Čísla dokumentů
  cisloZpravy: text("cislo_zpravy").notNull().default(""),
  cisloNabidky: text("cislo_nabidky").notNull().default(""),
  cisloDokumentu: text("cislo_dokumentu").notNull().default(""),
  mistoPodpisu: text("misto_podpisu").notNull().default(""),

  // Technické parametry
  soustava: text("soustava").notNull().default("3 N PE AC 400/230 V, 50 Hz, TN-C-S"),
  jistic: text("jistic").notNull().default(""),
  rezervovanyPrikon: text("rezervovany_prikon").notNull().default(""),
  vykonFve: text("vykon_fve").notNull().default(""),
  distributor: text("distributor").notNull().default(""),

    /** Zakázka v koši — vyplněné datum znamená „smazáno“, obnovit ji lze z koše. */
  smazanoAt: integer("smazano_at", { mode: "timestamp" }),
createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Vygenerovaný soubor — jeden řádek na dokument nahraný na Drive. */
export const dokumenty = sqliteTable("dokumenty", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  zakazkaId: integer("zakazka_id").notNull(),
  klic: text("klic").notNull(),
  nazev: text("nazev").notNull(),
  nazevSouboru: text("nazev_souboru").notNull(),
  revize: text("revize").notNull().default(""),
  driveFileId: text("drive_file_id").notNull().default(""),
  driveUrl: text("drive_url").notNull().default(""),
  velikost: integer("velikost").notNull().default(0),
  nevyplneno: integer("nevyplneno").notNull().default(0),
  stav: text("stav").notNull().default("ok"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Rejstřík zakázek — obchodní a fakturační evidence (list „Zakázky“ v 13_Evidence_zakazek). */
export const evidence = sqliteTable("evidence", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Vazba na zakázku v generátoru; prázdné = záznam vedený jen v rejstříku. */
  zakazkaId: integer("zakazka_id"),

  cislo: text("cislo").notNull().default(""),
  nazev: text("nazev").notNull().default(""),
  klient: text("klient").notNull().default(""),
  kontakt: text("kontakt").notNull().default(""),
  typ: text("typ").notNull().default(""),
  stav: text("stav").notNull().default("Poptávka"),

  datumPoptavky: text("datum_poptavky").notNull().default(""),
  terminOdevzdani: text("termin_odevzdani").notNull().default(""),
  datumPredani: text("datum_predani").notNull().default(""),

  revizeDokumentace: text("revize_dokumentace").notNull().default(""),
  datumRevize: text("datum_revize").notNull().default(""),

  cenaBezDph: integer("cena_bez_dph").notNull().default(0),
  cisloFaktury: text("cislo_faktury").notNull().default(""),
  datumFakturace: text("datum_fakturace").notNull().default(""),
  datumUhrady: text("datum_uhrady").notNull().default(""),
  fakturovano: text("fakturovano").notNull().default("Ne"),
  zaplaceno: text("zaplaceno").notNull().default("Ne"),

  posouzeniEru: text("posouzeni_eru").notNull().default("Ne"),
  predaniProvozniDokumentace: text("predani_provozni_dokumentace").notNull().default("Ne"),

  odkazNaSlozku: text("odkaz_na_slozku").notNull().default(""),
  poznamka: text("poznamka").notNull().default(""),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Hlídání zákonných lhůt revizí (list „Periodické revize“, příloha č. 4 NV 190/2022 Sb.). */
export const periodickeRevize = sqliteTable("periodicke_revize", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  zakazkaId: integer("zakazka_id"),

  klient: text("klient").notNull().default(""),
  objekt: text("objekt").notNull().default(""),
  druhRevize: text("druh_revize").notNull().default("Pravidelná"),
  datumPosledniRevize: text("datum_posledni_revize").notNull().default(""),
  /** Lhůta ve dnech podle přílohy č. 4 NV 190/2022 Sb. */
  lhutaDni: integer("lhuta_dni").notNull().default(1826),
  lhutaText: text("lhuta_text").notNull().default(""),
  kontakt: text("kontakt").notNull().default(""),
  poznamka: text("poznamka").notNull().default(""),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Rejstřík použitých norem — jediný zdroj pravdy o tom, které normy firma používá. */
export const normy = sqliteTable("normy", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  poradi: integer("poradi").notNull().default(0),

  oznaceni: text("oznaceni").notNull().default(""),
  nazev: text("nazev").notNull().default(""),
  edice: text("edice").notNull().default(""),
  druh: text("druh").notNull().default("ČSN"),
  ucinnostOd: text("ucinnost_od").notNull().default(""),
  prechodneDo: text("prechodne_do").notNull().default(""),
  pouziti: text("pouziti").notNull().default(""),

  posledniOvereni: text("posledni_overeni").notNull().default(""),
  overil: text("overil").notNull().default(""),
  stav: text("stav").notNull().default("platná"),
  zjistenaEdice: text("zjistena_edice").notNull().default(""),
  odkazOverit: text("odkaz_overit").notNull().default(""),
  poznamka: text("poznamka").notNull().default(""),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Termíny a změny s dopadem na dokumentaci (přechodná období zákonů a norem). */
export const terminyZmeny = sqliteTable("terminy_zmeny", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  datum: text("datum").notNull().default(""),
  co: text("co").notNull().default(""),
  dopad: text("dopad").notNull().default(""),
  odpovida: text("odpovida").notNull().default(""),
  stav: text("stav").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Šablona e-mailu — předmět a tělo se zástupnými znaky {{...}}. */
export const emailSablony = sqliteTable("email_sablony", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nazev: text("nazev").notNull().default(""),
  kategorie: text("kategorie").notNull().default("Obecné"),
  predmet: text("predmet").notNull().default(""),
  telo: text("telo").notNull().default(""),
  poradi: integer("poradi").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Připravená nebo odeslaná e-mailová zpráva. */
export const emailZpravy = sqliteTable("email_zpravy", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  zakazkaId: integer("zakazka_id"),
  sablonaId: integer("sablona_id"),
  sablonaNazev: text("sablona_nazev").notNull().default(""),
  komu: text("komu").notNull().default(""),
  kopie: text("kopie").notNull().default(""),
  predmet: text("predmet").notNull().default(""),
  telo: text("telo").notNull().default(""),
  /** pripraveno | odeslano | chyba */
  stav: text("stav").notNull().default("pripraveno"),
  poznamka: text("poznamka").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Klíč/hodnota — údaje firmy, nastavení Drive, uložený OAuth refresh token. */
export const nastaveni = sqliteTable("nastaveni", {
  klic: text("klic").primaryKey(),
  hodnota: text("hodnota").notNull().default(""),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ======================================================= provozní agenda kanceláře

/**
 * Osoby a jejich odborná způsobilost (NV č. 194/2022 Sb.), školení
 * a zdravotní způsobilost (vyhl. č. 79/2013 Sb.).
 */
export const osoby = sqliteTable("osoby", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jmeno: text("jmeno").notNull().default(""),
  funkce: text("funkce").notNull().default(""),
  /** poučená / elektrotechnik / vedoucí elektrotechnik / revizní technik */
  stupen: text("stupen").notNull().default("elektrotechnik"),
  /** Rozsah, např. E2A, E1B, E3A — rozlišovací znaky přílohy č. 5 NV 190/2022 Sb. */
  rozsah: text("rozsah").notNull().default(""),
  cisloDokladu: text("cislo_dokladu").notNull().default(""),
  dokladPlatnostDo: text("doklad_platnost_do").notNull().default(""),
  skoleniPosledni: text("skoleni_posledni").notNull().default(""),
  zdravotniPosledni: text("zdravotni_posledni").notNull().default(""),
  zdravotniPristi: text("zdravotni_pristi").notNull().default(""),
  datumNarozeni: text("datum_narozeni").notNull().default(""),
  telefon: text("telefon").notNull().default(""),
  email: text("email").notNull().default(""),
  aktivni: integer("aktivni", { mode: "boolean" }).notNull().default(true),
  poznamka: text("poznamka").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

/** Měřicí přístroje a jejich kalibrace — soupis pro § 10 odst. 1 písm. g) NV 190/2022 Sb. */
export const meridla = sqliteTable("meridla", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nazev: text("nazev").notNull().default(""),
  vyrobce: text("vyrobce").notNull().default(""),
  typ: text("typ").notNull().default(""),
  vyrobniCislo: text("vyrobni_cislo").notNull().default(""),
  kalibracniList: text("kalibracni_list").notNull().default(""),
  kalibraceDatum: text("kalibrace_datum").notNull().default(""),
  /** Interval kalibrace v měsících — obvykle 12, podle výrobce. */
  intervalMesicu: integer("interval_mesicu").notNull().default(12),
  kalibroval: text("kalibroval").notNull().default(""),
  aktivni: integer("aktivni", { mode: "boolean" }).notNull().default(true),
  poznamka: text("poznamka").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

/** Oprávnění a doklady firmy — oprávnění TIČR (10 let), živnostenská oprávnění, pojištění. */
export const opravneni = sqliteTable("opravneni", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  druh: text("druh").notNull().default(""),
  cislo: text("cislo").notNull().default(""),
  rozsah: text("rozsah").notNull().default(""),
  vydal: text("vydal").notNull().default(""),
  platnostOd: text("platnost_od").notNull().default(""),
  platnostDo: text("platnost_do").notNull().default(""),
  poznamka: text("poznamka").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

/** Provozní deník — záznamy o prohlídkách, zkouškách, údržbě a závadách (§ 7 odst. 5 písm. c)). */
export const prohlidky = sqliteTable("prohlidky", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  zakazkaId: integer("zakazka_id"),
  datum: text("datum").notNull().default(""),
  druh: text("druh").notNull().default("Prohlídka"),
  rozsah: text("rozsah").notNull().default(""),
  provedl: text("provedl").notNull().default(""),
  vysledek: text("vysledek").notNull().default(""),
  zavada: text("zavada").notNull().default(""),
  odstraneno: text("odstraneno").notNull().default(""),
  poznamka: text("poznamka").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
