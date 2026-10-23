/**
 * Revizní a personální dokumenty, které chyběly v sadě šablon.
 *
 * P7  Souhrnná zpráva o výchozí revizi — § 10 odst. 2 NV č. 190/2022 Sb.
 * P8  Podklady k žádosti o osvědčení VEZ I. třídy — § 6 odst. 6 NV č. 190/2022 Sb.,
 *     § 6 odst. 1 písm. b) zákona č. 250/2021 Sb.
 * P9  Zpráva o revizi elektrických spotřebičů a ručního nářadí — ČSN 33 1600 ed. 2
 * P10 Záznam o školení a ověření znalostí — § 3 odst. 4 NV č. 194/2022 Sb.
 * P11 Provozní deník elektrického zařízení — § 7 odst. 5 písm. c) NV č. 190/2022 Sb.
 */
import { Paragraph, Table } from "docx";
import type { Firma, Zakazka } from "../map";
import { formatDate } from "../map";
import {
  aktivniMeridla,
  kalibraceDo,
  osobaStupne,
  plusMesicu,
  popisOsoby,
  VYCHOZI_MOZNOSTI,
  type Moznosti,
} from "./doplnky";
import {
  hd,
  hv,
  identifikaceStavby,
  kontext,
  mistoDatum,
  nadpisDokumentu,
  nadpisSekce,
  odrazka,
  odstavec,
  podpisy,
  poznamka,
  run,
  sestavDocx,
  spoj,
  tabulka,
  tabulkaDvojic,
  type Bunka,
  type Kontext,
  type VysledekNoveho,
} from "./styl";

const mezera = () => odstavec([run("")], { spaceAfter: 60 });

/** Soupis měřicích přístrojů z evidence; když evidence chybí, dva řádky k doplnění. */
function soupisMeridel(ctx: Kontext): Table {
  const meridla = aktivniMeridla(ctx.doplnky);
  const radky: Bunka[][] = meridla.length
    ? meridla.map((m) => [
        spoj([m.nazev, m.vyrobce, m.typ], " ") || "—",
        hv(ctx, m.vyrobniCislo, "[VÝROBNÍ ČÍSLO]"),
        hv(ctx, m.kalibracniList, "[ČÍSLO KALIBRAČNÍHO LISTU]"),
        hv(ctx, formatDate(kalibraceDo(m)), "[PLATNOST KALIBRACE]"),
      ])
    : [0, 1].map(() => [
        hv(ctx, "", "[MĚŘICÍ PŘÍSTROJ — VÝROBCE, TYP]"),
        hv(ctx, "", "[VÝROBNÍ ČÍSLO]"),
        hv(ctx, "", "[ČÍSLO KALIBRAČNÍHO LISTU]"),
        hv(ctx, "", "[PLATNOST KALIBRACE]"),
      ]);
  return tabulka(["Přístroj", "Výrobní číslo", "Kalibrační list", "Kalibrace platná do"], radky, {
    sirky: [40, 18, 22, 20],
  });
}

function revizniTechnik(ctx: Kontext): string {
  return popisOsoby(osobaStupne(ctx.doplnky, "revizní technik"), formatDate);
}

// ------------------------------------------------------------------- P7

export async function souhrnnaZprava(z: Zakazka, f: Firma, o: Moznosti = VYCHOZI_MOZNOSTI): Promise<VysledekNoveho> {
  const ctx = kontext(z, f, o);
  const rt = osobaStupne(ctx.doplnky, "revizní technik");
  const deti: (Paragraph | Table)[] = [
    ...nadpisDokumentu("Souhrnná zpráva o výchozí revizi", "§ 10 odst. 2 nařízení vlády č. 190/2022 Sb."),
    odstavec([
      run("Vyhrazené elektrické zařízení bylo revidováno po částech. Tato souhrnná zpráva shrnuje výsledky dílčích zpráv o výchozí revizi a obsahuje celkové zhodnocení zařízení jako celku."),
    ]),
    nadpisSekce("a) Provozovatel a b) identifikace zařízení"),
    identifikaceStavby(ctx, { sCislemDokumentu: z.cisloZpravy ? `${z.cisloZpravy}-S` : "" }),
    nadpisSekce("c) Vymezení rozsahu revize"),
    tabulkaDvojic([
      { popisek: "Druh revize", hodnota: run("Výchozí — souhrnná zpráva", { bold: true }) },
      { popisek: "Rozsah revize", hodnota: hv(ctx, "", "[CO ZAŘÍZENÍ ZAHRNUJE — ROZVADĚČE, OBVODY, LPS, FVE]") },
      { popisek: "Co revize nezahrnuje", hodnota: hv(ctx, "", "[ČÁSTI MIMO ROZSAH]") },
      { popisek: "Třída zařízení", hodnota: hv(ctx, "", "[I. / II. — § 4 NV č. 190/2022 Sb.]") },
    ]),
    nadpisSekce("Dílčí zprávy o výchozí revizi"),
    tabulka(
      ["Číslo zprávy", "Revidovaná část zařízení", "Revizní technik", "Datum předání", "Závěr"],
      [
        [hv(ctx, z.cisloZpravy, "[ČÍSLO ZPRÁVY]"), hv(ctx, "", "[ČÁST ZAŘÍZENÍ]"), hv(ctx, rt?.jmeno, "[REVIZNÍ TECHNIK]"), hv(ctx, "", "[DATUM]"), hv(ctx, "", "[SCHOPNÉ / NESCHOPNÉ]")],
        [hv(ctx, "", "[ČÍSLO ZPRÁVY]"), hv(ctx, "", "[ČÁST ZAŘÍZENÍ]"), hv(ctx, "", "[REVIZNÍ TECHNIK]"), hv(ctx, "", "[DATUM]"), hv(ctx, "", "[SCHOPNÉ / NESCHOPNÉ]")],
        [hv(ctx, "", "[ČÍSLO ZPRÁVY]"), hv(ctx, "", "[ČÁST ZAŘÍZENÍ]"), hv(ctx, "", "[REVIZNÍ TECHNIK]"), hv(ctx, "", "[DATUM]"), hv(ctx, "", "[SCHOPNÉ / NESCHOPNÉ]")],
      ],
      { sirky: [16, 30, 22, 14, 18] },
    ),
    nadpisSekce("d) Revizní technik"),
    tabulkaDvojic([
      { popisek: "Jméno, evidenční číslo osvědčení, rozsah", hodnota: hv(ctx, revizniTechnik(ctx), "[JMÉNO, EV. Č. OSVĚDČENÍ, E1/E2/E3 + A/B]") },
      { popisek: "Oprávnění firmy", hodnota: hv(ctx, spoj(ctx.doplnky.opravneni.filter((x) => /tičr|oprávnění/i.test(x.druh)).map((x) => spoj([x.cislo, x.rozsah], " — "))), "[ČÍSLO OPRÁVNĚNÍ TIČR, ROZSAH]") },
    ]),
    nadpisSekce("f) Data revize"),
    tabulkaDvojic([
      { popisek: "Zahájení", hodnota: hv(ctx, "", "[DATUM ZAHÁJENÍ]") },
      { popisek: "Ukončení", hodnota: hv(ctx, "", "[DATUM UKONČENÍ]") },
      { popisek: "Vypracování", hodnota: hd(ctx, z.datum, "[DATUM VYPRACOVÁNÍ]") },
      { popisek: "Předání", hodnota: hv(ctx, "", "[DATUM PŘEDÁNÍ]") },
    ]),
    nadpisSekce("g) Soupis použitých měřicích přístrojů"),
    soupisMeridel(ctx),
    nadpisSekce("h) Podklady pro výchozí revizi"),
    odstavec([run("Podle přílohy č. 2 části A NV č. 190/2022 Sb. byly pro výchozí revizi použity:")]),
    odrazka("průvodní, projektová a výkresová dokumentace, včetně dokumentace skutečného provedení;"),
    odrazka("protokol o určení vnějších vlivů;"),
    odrazka("dílčí zprávy o výchozí revizi částí zařízení uvedené výše;"),
    odrazka("záznamy o prohlídkách a zkouškách v průběhu montáže;"),
    odrazka("výpočet řízení rizika podle ČSN EN 62305-2 — u zařízení ochrany před bleskem;"),
    odrazka("protokoly o kusovém ověřování rozváděčů;"),
    odrazka("identifikace zhotovitele elektrické instalace."),
    nadpisSekce("l) Přehled závad"),
    tabulka(
      ["Závada", "Porušený předpis", "Termín odstranění"],
      [[hv(ctx, "", "[ŽÁDNÉ / POPIS ZÁVADY]"), hv(ctx, "", "[ČSN, ČLÁNEK]"), hv(ctx, "", "[DATUM]")]],
      { sirky: [50, 28, 22] },
    ),
    nadpisSekce("m) Celkové zhodnocení"),
    odstavec([
      run("Elektrické zařízení jako celek je z hlediska bezpečnosti "),
      hv(ctx, "", "[SCHOPNÉ / NESCHOPNÉ]", { bold: true }),
      run(" bezpečného provozu. "),
      hv(ctx, "", "[ODŮVODNĚNÍ, NENÍ-LI SCHOPNÉ]"),
    ]),
    nadpisSekce("o) Lhůta příští revize"),
    tabulkaDvojic([
      { popisek: "Doporučená lhůta", hodnota: hv(ctx, "", "[X let — příloha č. 4 NV č. 190/2022 Sb.]") },
      { popisek: "Příští pravidelná revize nejpozději", hodnota: hd(ctx, z.datumPristiRevize, "[DATUM PŘÍŠTÍ REVIZE]") },
    ]),
    poznamka(
      "Výchozí revizní zpráva i tato souhrnná zpráva se uchovávají po celou dobu provozu zařízení, až do jeho úplného zrušení.",
    ),
    mistoDatum(ctx),
    podpisy(ctx, [
      { role: "Revizní technik — vypracoval a předal", jmeno: rt?.jmeno || undefined },
      { role: "Provozovatel — převzal", jmeno: z.investorZastupce || z.investor || undefined },
    ]),
  ];
  return sestavDocx(ctx, "Souhrnná zpráva o výchozí revizi", deti);
}

// ------------------------------------------------------------------- P8

export async function podkladyOsvedceniI(z: Zakazka, f: Firma, o: Moznosti = VYCHOZI_MOZNOSTI): Promise<VysledekNoveho> {
  const ctx = kontext(z, f, o);
  const opr = ctx.doplnky.opravneni.find((x) => /tičr|oprávnění/i.test(x.druh));
  const deti: (Paragraph | Table)[] = [
    ...nadpisDokumentu(
      "Podklady k žádosti o osvědčení vyhrazeného elektrického zařízení I. třídy",
      "§ 6 odst. 1 písm. b) zákona č. 250/2021 Sb. · § 6 odst. 6 NV č. 190/2022 Sb.",
    ),
    odstavec([
      run("Vyhrazené elektrické zařízení I. třídy lze uvést do provozu jen na základě osvědčení vydaného pověřenou organizací — Technickou inspekcí České republiky. Žádost se podává elektronicky na www.ticr.eu (Žádosti a formuláře — Žádost o provedení prohlídky, řízení a vyhodnocení zkoušky — elektrická). Tento dokument shrnuje údaje do žádosti a soupis podkladů, které inspektor TIČR při šetření požaduje."),
    ]),
    nadpisSekce("1. Žadatel a zařízení"),
    identifikaceStavby(ctx),
    mezera(),
    tabulkaDvojic([
      { popisek: "Kontaktní osoba žadatele", hodnota: hv(ctx, z.investorZastupce || z.zakaznikZastupce, "[JMÉNO, TELEFON, E-MAIL]") },
      { popisek: "Montážní organizace", hodnota: hv(ctx, spoj([f.nazev, f.ico ? `IČO ${f.ico}` : ""]), "[MONTÁŽNÍ ORGANIZACE, IČO]") },
      { popisek: "Oprávnění montážní organizace", hodnota: hv(ctx, opr ? spoj([opr.cislo, opr.rozsah, opr.platnostDo ? `platné do ${formatDate(opr.platnostDo)}` : ""]) : "", "[ČÍSLO OPRÁVNĚNÍ TIČR, ROZSAH, PLATNOST]") },
      { popisek: "Požadovaný termín šetření", hodnota: hv(ctx, "", "[TERMÍN]") },
    ]),
    nadpisSekce("2. Důvod zařazení do I. třídy (§ 4 odst. 1 NV č. 190/2022 Sb.)"),
    tabulka(
      ["Kritérium", "Platí"],
      [
        ["Prostory s extrémně vysokými teplotami okolí nad +55 °C", hv(ctx, "", "[ANO / NE]")],
        ["Prostory s tryskající vodou a s možností ponoření", hv(ctx, "", "[ANO / NE]")],
        ["Prostory s trvalým výskytem korozivních nebo znečišťujících látek", hv(ctx, "", "[ANO / NE]")],
        ["Prostory s nebezpečím požáru hořlavých kapalin", hv(ctx, "", "[ANO / NE]")],
        ["Prostředí s nebezpečím výbuchu", hv(ctx, "", "[ANO / NE]")],
        ["Objekt pro přítomnost více než 200 osob podle požárně bezpečnostního řešení", hv(ctx, "", "[ANO / NE]")],
        ["Zdravotnické prostory", hv(ctx, "", "[ANO / NE]")],
        ["Systém ochrany před bleskem chránící zařízení uvedená výše", hv(ctx, "", "[ANO / NE]")],
      ],
      { sirky: [80, 20] },
    ),
    nadpisSekce("3. Soupis podkladů pro šetření"),
    tabulka(
      ["Podklad", "Označení / číslo", "Přiloženo"],
      [
        ["Projektová dokumentace a dokumentace skutečného provedení", hv(ctx, z.cisloDokumentu, "[OZNAČENÍ]"), hv(ctx, "", "[ANO / NE]")],
        ["Protokol o určení vnějších vlivů", hv(ctx, "", "[ČÍSLO PROTOKOLU]"), hv(ctx, "", "[ANO / NE]")],
        ["Zpráva o výchozí revizi, případně souhrnná zpráva", hv(ctx, z.cisloZpravy, "[ČÍSLO ZPRÁVY]"), hv(ctx, "", "[ANO / NE]")],
        ["Požárně bezpečnostní řešení stavby", hv(ctx, "", "[OZNAČENÍ]"), hv(ctx, "", "[ANO / NE]")],
        ["Oprávnění montážní organizace (TIČR)", hv(ctx, opr?.cislo, "[ČÍSLO OPRÁVNĚNÍ]"), hv(ctx, "", "[ANO / NE]")],
        ["Prohlášení o shodě a certifikáty použitých výrobků", hv(ctx, "", "[SOUPIS]"), hv(ctx, "", "[ANO / NE]")],
        ["Protokoly o kusovém ověřování rozváděčů", hv(ctx, "", "[SOUPIS]"), hv(ctx, "", "[ANO / NE]")],
        ["Řád prohlídek, údržby a revizí; místní provozní bezpečnostní předpis", hv(ctx, "", "[OZNAČENÍ]"), hv(ctx, "", "[ANO / NE]")],
        ["Výpočet řízení rizika ČSN EN 62305-2 (je-li LPS)", hv(ctx, "", "[OZNAČENÍ]"), hv(ctx, "", "[ANO / NE]")],
      ],
      { sirky: [52, 28, 20] },
    ),
    poznamka(
      "Poplatky za činnost pověřené organizace stanoví nařízení vlády č. 60/2022 Sb. Nebylo-li šetření úspěšné, lze po odstranění závad celý postup opakovat. Vydané osvědčení uchovává provozovatel po celou dobu provozu zařízení.",
    ),
    mistoDatum(ctx),
    podpisy(ctx, [
      { role: "Za montážní organizaci", jmeno: f.jednatel || undefined },
      { role: "Za provozovatele (žadatele)", jmeno: z.investorZastupce || z.investor || undefined },
    ]),
  ];
  return sestavDocx(ctx, "Podklady k žádosti o osvědčení VEZ I. třídy", deti);
}

// ------------------------------------------------------------------- P9

export async function revizeSpotrebicu(z: Zakazka, f: Firma, o: Moznosti = VYCHOZI_MOZNOSTI): Promise<VysledekNoveho> {
  const ctx = kontext(z, f, o);
  const rt = osobaStupne(ctx.doplnky, "revizní technik");
  const radekSpotrebice = (): Bunka[] => [
    hv(ctx, "", "[Č.]"),
    hv(ctx, "", "[NÁZEV, TYP, VÝR. Č.]"),
    hv(ctx, "", "[A–E]"),
    hv(ctx, "", "[I–III]"),
    hv(ctx, "", "[Ω]"),
    hv(ctx, "", "[MΩ]"),
    hv(ctx, "", "[mA]"),
    hv(ctx, "", "[VYHOVÍ / NEVYHOVÍ]"),
  ];
  const deti: (Paragraph | Table)[] = [
    ...nadpisDokumentu("Zpráva o revizi elektrických spotřebičů a ručního nářadí", "ČSN 33 1600 ed. 2 · ČSN EN 50699 · NV č. 378/2001 Sb."),
    tabulkaDvojic([
      { popisek: "Číslo zprávy", hodnota: hv(ctx, z.cisloZpravy ? `${z.cisloZpravy}-SP` : "", "[ČÍSLO ZPRÁVY]") },
      { popisek: "Provozovatel", hodnota: hv(ctx, spoj([z.investor, z.investorAdresa, z.investorIco ? `IČO ${z.investorIco}` : ""]), "[PROVOZOVATEL, SÍDLO, IČO]") },
      { popisek: "Místo revize", hodnota: hv(ctx, z.adresaStavby, "[MÍSTO]") },
      { popisek: "Druh revize", hodnota: hv(ctx, "", "[OPAKOVANÁ / PO OPRAVĚ / PŘED VYDÁNÍM]") },
      { popisek: "Datum revize", hodnota: hd(ctx, z.datum, "[DATUM]") },
      { popisek: "Revizní technik", hodnota: hv(ctx, revizniTechnik(ctx), "[JMÉNO, EV. Č. OSVĚDČENÍ, ROZSAH]") },
    ]),
    nadpisSekce("Postup"),
    odstavec([
      run("Revize zahrnuje prohlídku, měření elektrických parametrů a zkoušku funkce podle ČSN 33 1600 ed. 2. Měření proběhlo podle ČSN EN 50699. Spotřebiče nejsou vyhrazenými elektrickými zařízeními (§ 3 odst. 2 písm. a) a b) NV č. 190/2022 Sb.); povinnost revizí vyplývá z § 4 odst. 1 písm. c) zákona č. 309/2006 Sb. a § 4 odst. 2 NV č. 378/2001 Sb."),
    ]),
    nadpisSekce("Měřicí přístroje"),
    soupisMeridel(ctx),
    nadpisSekce("Seznam revidovaných spotřebičů"),
    tabulka(
      ["Ev. č.", "Spotřebič", "Skupina", "Třída", "RPE (Ω)", "RISO (MΩ)", "Iunik (mA)", "Výsledek"],
      [radekSpotrebice(), radekSpotrebice(), radekSpotrebice(), radekSpotrebice(), radekSpotrebice()],
      { sirky: [7, 24, 10, 9, 11, 12, 11, 16] },
    ),
    nadpisSekce("Skupiny spotřebičů podle užívání"),
    tabulka(
      ["Skupina", "Užívání"],
      [
        ["A", "Spotřebiče poskytované formou pronájmu dalšímu provozovateli nebo uživateli"],
        ["B", "Spotřebiče používané ve venkovním prostoru — stavby, zemědělské práce"],
        ["C", "Spotřebiče používané při průmyslové a řemeslné činnosti ve vnitřních prostorech"],
        ["D", "Spotřebiče používané ve veřejně přístupných prostorech — školy, hotely, kluby"],
        ["E", "Spotřebiče používané při administrativní činnosti"],
      ],
      { sirky: [14, 86] },
    ),
    poznamka(
      "Lhůty opakovaných zkoušek a revizí se stanoví podle tabulky 1 ČSN 33 1600 ed. 2 (ve znění změn Z1 a Z2) podle skupiny, třídy ochrany a toho, zda je spotřebič držen v ruce. Při souběhu termínů splňuje opakovaná revize i požadavek na opakovanou zkoušku. Prodlužovací přívody s ochranným vodičem se posuzují jako spotřebiče třídy ochrany I.",
    ),
    nadpisSekce("Závěr"),
    tabulkaDvojic([
      { popisek: "Počet revidovaných spotřebičů", hodnota: hv(ctx, "", "[POČET]") },
      { popisek: "Z toho nevyhovělo", hodnota: hv(ctx, "", "[POČET — vyřazeny a označeny]") },
      { popisek: "Celkový závěr", hodnota: hv(ctx, "", "[SPOTŘEBIČE JSOU / NEJSOU SCHOPNÉ BEZPEČNÉHO PROVOZU]", { bold: true }) },
      { popisek: "Příští revize", hodnota: hv(ctx, "", "[DATUM — dle tab. 1 ČSN 33 1600 ed. 2]") },
    ]),
    mistoDatum(ctx),
    podpisy(ctx, [
      { role: "Revizní technik", jmeno: rt?.jmeno || undefined },
      { role: "Provozovatel — převzal", jmeno: z.investorZastupce || z.investor || undefined },
    ]),
  ];
  return sestavDocx(ctx, "Zpráva o revizi spotřebičů a ručního nářadí", deti);
}

// ------------------------------------------------------------------ P10

export async function zaznamSkoleni(z: Zakazka, f: Firma, o: Moznosti = VYCHOZI_MOZNOSTI): Promise<VysledekNoveho> {
  const ctx = kontext(z, f, o);
  const osoby = ctx.doplnky.osoby.filter((x) => x.aktivni && x.stupen !== "osoba poučená");
  const vedouci = osobaStupne(ctx.doplnky, "vedoucí elektrotechnik") ?? osobaStupne(ctx.doplnky, "revizní technik");
  const radky: Bunka[][] = osoby.length
    ? osoby.map((x) => [
        x.jmeno,
        spoj([x.stupen, x.rozsah], ", "),
        hv(ctx, x.cisloDokladu, "[ČÍSLO DOKLADU]"),
        hv(ctx, formatDate(x.dokladPlatnostDo), "[PLATNOST]"),
        hv(ctx, "", "[PODPIS]"),
      ])
    : [0, 1, 2].map(() => [
        hv(ctx, "", "[JMÉNO A PŘÍJMENÍ]"),
        hv(ctx, "", "[STUPEŇ, ROZSAH]"),
        hv(ctx, "", "[ČÍSLO DOKLADU]"),
        hv(ctx, "", "[PLATNOST]"),
        hv(ctx, "", "[PODPIS]"),
      ]);
  // další školení se počítá od tohoto školení, ne od posledního záznamu v evidenci
  const pristi = z.datum ? plusMesicu(z.datum, 12) : "";
  const deti: (Paragraph | Table)[] = [
    ...nadpisDokumentu("Záznam o školení a ověření znalostí", "§ 3 odst. 4 NV č. 194/2022 Sb."),
    odstavec([
      run("Osoby odborně způsobilé k činnosti na elektrických zařízeních se pravidelně školí o právních a ostatních předpisech k zajištění bezpečnosti a ochrany zdraví při práci. Není-li četnost stanovena vnitřním předpisem, provádí se školení nejméně jednou ročně."),
    ]),
    tabulkaDvojic([
      { popisek: "Organizace", hodnota: hv(ctx, spoj([f.nazev, f.ico ? `IČO ${f.ico}` : ""]), "[FIRMA, IČO]") },
      { popisek: "Datum školení", hodnota: hv(ctx, formatDate(z.datum), "[DATUM]") },
      { popisek: "Školitel", hodnota: hv(ctx, popisOsoby(vedouci, formatDate), "[JMÉNO, STUPEŇ, ČÍSLO DOKLADU]") },
      { popisek: "Rozsah školení", hodnota: hv(ctx, "", "[HODIN / FORMA — PREZENČNĚ, E-LEARNING]") },
      { popisek: "Ověření znalostí", hodnota: hv(ctx, "", "[TEST / ÚSTNĚ — VÝSLEDEK]") },
    ]),
    nadpisSekce("Obsah školení"),
    odrazka("zákon č. 250/2021 Sb., NV č. 190/2022 Sb., NV č. 194/2022 Sb. a jejich změny;"),
    odrazka("ČSN EN 50110-1 ed. 4 a ČSN EN 50110-2 ed. 4 — obsluha a práce na elektrických instalacích;"),
    odrazka("ČSN 33 2000-6 ed. 2 — revize, ČSN 33 1600 ed. 2 — revize spotřebičů;"),
    odrazka("vyhodnocení elektrického rizika, stanovení vedoucího práce, zajištění pracoviště;"),
    odrazka("osobní ochranné pracovní prostředky a jejich kontrola;"),
    odrazka("první pomoc při úrazu elektrickým proudem;"),
    odrazka("změny norem zachycené v rejstříku použitých norem kanceláře;"),
    odrazka([run("místní provozní bezpečnostní předpisy: "), hv(ctx, "", "[OZNAČENÍ]")]),
    nadpisSekce("Proškolené osoby"),
    tabulka(["Jméno a příjmení", "Stupeň, rozsah", "Číslo dokladu", "Doklad platný do", "Podpis"], radky, {
      sirky: [24, 24, 18, 16, 18],
    }),
    poznamka(
      `Další školení nejpozději do ${pristi ? formatDate(pristi) : "12 měsíců od data tohoto školení"}, nestanoví-li vnitřní předpis jinak. Doklad o odborné způsobilosti se obnovuje přezkoušením — obvykle po 3 letech; osvědčení revizního technika má platnost 5 let. Zdravotní způsobilost se ověřuje periodickou prohlídkou podle vyhlášky č. 79/2013 Sb.`,
    ),
    mistoDatum(ctx),
    podpisy(ctx, [
      { role: "Školitel", jmeno: vedouci?.jmeno || undefined },
      { role: "Za organizaci", jmeno: f.jednatel || undefined },
    ]),
  ];
  return sestavDocx(ctx, "Záznam o školení a ověření znalostí", deti);
}

// ------------------------------------------------------------------ P11

export async function provozniDenik(z: Zakazka, f: Firma, o: Moznosti = VYCHOZI_MOZNOSTI): Promise<VysledekNoveho> {
  const ctx = kontext(z, f, o);
  const zaznamy = ctx.doplnky.prohlidky;
  const radky: Bunka[][] = zaznamy.map((p) => [
    formatDate(p.datum) || "—",
    p.druh,
    spoj([p.rozsah, p.vysledek], " — ") || "—",
    spoj([p.zavada, p.odstraneno ? `odstraněno: ${p.odstraneno}` : ""], "; ") || "bez závad",
    p.provedl || "—",
  ]);
  const prazdne = Math.max(8, 14 - radky.length);
  for (let i = 0; i < prazdne; i++) radky.push(["", "", "", "", ""]);
  const deti: (Paragraph | Table)[] = [
    ...nadpisDokumentu("Provozní deník elektrického zařízení", "§ 7 odst. 5 písm. c) NV č. 190/2022 Sb."),
    identifikaceStavby(ctx),
    mezera(),
    tabulkaDvojic([
      { popisek: "Deník založen", hodnota: hd(ctx, z.datum, "[DATUM]") },
      { popisek: "Odpovědná osoba provozovatele", hodnota: hv(ctx, z.investorZastupce || z.zakaznikZastupce, "[JMÉNO A PŘÍJMENÍ]") },
      { popisek: "Příští pravidelná revize", hodnota: hd(ctx, z.datumPristiRevize, "[DATUM PŘÍŠTÍ REVIZE]") },
    ]),
    nadpisSekce("Záznamy o prohlídkách, zkouškách, údržbě a závadách"),
    tabulka(["Datum", "Druh úkonu", "Rozsah a výsledek", "Závada a odstranění", "Provedl / podpis"], radky, {
      sirky: [12, 15, 33, 24, 16],
    }),
    poznamka(
      "Do deníku se zapisuje každá prohlídka, zkouška, údržba, oprava i mimořádná událost. Zjištěné závady se odstraňují bez zbytečného odkladu; stav bezprostředně ohrožující bezpečnost se řeší odpojením zařízení a zajištěním proti nežádoucímu připojení. Deník je trvale k dispozici orgánům státního odborného dozoru.",
    ),
  ];
  return sestavDocx(ctx, "Provozní deník elektrického zařízení", deti);
}
