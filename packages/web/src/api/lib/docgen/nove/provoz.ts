/**
 * Provozní dokumentace vyhrazeného elektrického zařízení podle NV č. 190/2022 Sb.
 *
 * P1 Řád prohlídek, údržby a revizí — § 2 písm. d) a § 7 odst. 5
 * P2 Pověření osoby odpovědné za elektrické zařízení — § 8 písm. d)
 * P3 Zápis o vyhodnocení elektrického rizika — § 8 písm. b)
 * P4 Stanovení vedoucího práce — § 8 písm. e)
 * P5 Zápis o seznámení s OOPP — § 7 odst. 6
 * P6 Zápis o poučení a ověření znalostí — § 4 odst. 3 NV č. 194/2022 Sb.
 */
import { Paragraph, Table, TextRun } from "docx";
import type { Firma, Zakazka } from "../map";
import { formatDate } from "../map";
import { osobaStupne, popisOsoby, VYCHOZI_MOZNOSTI, type Moznosti } from "./doplnky";
import {
  hv,
  hd,
  identifikaceStavby,
  kontext,
  mistoDatum,
  nadpisDokumentu,
  nadpisSekce,
  odstavec,
  odrazka,
  podpisy,
  poznamka,
  radek,
  run,
  sestavDocx,
  spoj,
  tabulka,
  tabulkaDvojic,
  type Kontext,
  type VysledekNoveho,
} from "./styl";

/**
 * Datum úkonu (vyhodnocení, poučení, účinnost řádu) = datum dokumentu ze
 * zakázky — stejné jako u podpisů, aby se v jednom zápisu nepotkala dvě data.
 */
function datumDokumentu(ctx: Kontext): string {
  return formatDate(ctx.zakazka.datum);
}

function identifikaceProvozovatele(ctx: Kontext): Table {
  const z = ctx.zakazka;
  return tabulkaDvojic([
    {
      popisek: "Provozovatel zařízení",
      hodnota: hv(ctx, spoj([z.investor, z.investorAdresa]), "[PROVOZOVATEL, SÍDLO]"),
    },
    { popisek: "IČO / DIČ", hodnota: hv(ctx, spoj([z.investorIco, z.investorDic]), "[IČO / DIČ]") },
    { popisek: "Odpovědná osoba", hodnota: hv(ctx, z.zakaznikZastupce || z.investorZastupce, "[JMÉNO A PŘÍJMENÍ]") },
  ]);
}

// ------------------------------------------------------------------- P1

const LHUTY_PRAVIDELNE: [string, string][] = [
  ["V objektech určených pro administrativní činnost", "5 let"],
  ["V objektech pro výrobu, vzdělávání, ubytování a lékařské účely", "3 roky"],
  ["Elektrické zařízení v objektu pro přítomnost více než 200 osob", "2 roky"],
  ["Prozatímní zařízení stavenišť", "0,5 roku"],
  ["Pojízdné a převozné prostředky", "1 rok"],
  ["Prostory s nebezpečím požáru a výbuchu", "3 roky"],
  ["Prostory mokré a s trvalým výskytem korozivních nebo znečišťujících látek", "1 rok"],
  ["LPS chránící kritické systémy", "2 roky"],
  ["LPS chránící ostatní objekty nebo zařízení", "4 roky"],
];

export async function radProhlidek(z: Zakazka, f: Firma, o: Moznosti = VYCHOZI_MOZNOSTI): Promise<VysledekNoveho> {
  const ctx = kontext(z, f, o);
  const deti: (Paragraph | Table)[] = [
    ...nadpisDokumentu("Řád prohlídek, údržby a revizí", "Provozní dokumentace vyhrazeného elektrického zařízení"),
    odstavec([
      run("Zpracováno podle § 2 písm. d) a § 7 odst. 5 nařízení vlády č. 190/2022 Sb., o vyhrazených technických elektrických zařízeních a požadavcích na zajištění jejich bezpečnosti, ve znění pozdějších předpisů."),
    ]),

    nadpisSekce("1. Provozované elektrické zařízení"),
    identifikaceStavby(ctx),
    odstavec([run("")], { spaceAfter: 60 }),
    identifikaceProvozovatele(ctx),

    nadpisSekce("2. Účel a působnost řádu"),
    odstavec([
      run("Tento řád vymezuje požadavky, lhůty, postupy, pravidla a záznamy o ověřování bezpečnosti, údržbě, prohlídkách, opravách a rekonstrukcích vyhrazeného elektrického zařízení uvedeného v článku 1, včetně preventivní údržby. Vyhrazené elektrické zařízení lze provozovat pouze tehdy, byl-li jeho stav ověřen prohlídkou, zkouškou, kontrolou a revizí ve lhůtách stanovených tímto řádem."),
    ]),
    odstavec([
      run("Řád se vztahuje na všechny osoby, které na zařízení vykonávají činnost, obsluhu nebo práce v jeho blízkosti. Je-li pro některou část zařízení vydán řád preventivní údržby, je tento řád jeho součástí."),
    ]),

    nadpisSekce("3. Zařazení zařízení do třídy"),
    tabulkaDvojic([
      { popisek: "Třída vyhrazeného elektrického zařízení", hodnota: hv(ctx, "", "[I. / II. — podle § 4 NV č. 190/2022 Sb.]") },
      {
        popisek: "Rozhodná kritéria",
        hodnota: odrazkyDoBunky([
          "prostory s extrémně vysokými teplotami okolí nad +55 °C",
          "prostory s tryskající vodou a možností ponoření",
          "prostory s trvalým výskytem korozivních nebo znečišťujících látek",
          "prostory s nebezpečím požáru hořlavých kapalin",
          "prostředí s nebezpečím výbuchu plynů, par nebo prachů",
          "objekt pro přítomnost více než 200 osob podle požárně bezpečnostního řešení",
          "elektrická instalace ve zdravotnických prostorech",
        ]),
      },
    ]),
    poznamka(
      "Zařízení I. třídy lze uvést do provozu jen na základě osvědčení vydaného pověřenou organizací podle § 6 odst. 1 písm. b) zákona č. 250/2021 Sb. Toto osvědčení uchovává provozovatel po celou dobu provozu zařízení.",
    ),

    nadpisSekce("4. Lhůty pravidelných revizí"),
    odstavec([
      run("Základní nejdelší lhůty pravidelných revizí podle přílohy č. 4 NV č. 190/2022 Sb. Pokud se na zařízení vztahuje více než jedna lhůta, použije se lhůta nejkratší. Uvedená lhůta se použije pro konkrétní zařízení jen tehdy, je-li v tabulce označena."),
    ]),
    tabulka(["Podle objektu a prostoru", "Lhůta", "Platí pro toto zařízení"], LHUTY_PRAVIDELNE.map(([a, b]) => [a, b, hv(ctx, "", "[ANO / NE]")]), {
      sirky: [58, 14, 28],
    }),
    odstavec([run("")], { spaceAfter: 60 }),
    tabulkaDvojic([
      { popisek: "Vypočtená lhůta pravidelné revize", hodnota: hv(ctx, "", "[X let]") },
      { popisek: "Datum poslední revize", hodnota: hv(ctx, "", "[DATUM POSLEDNÍ REVIZE]") },
      { popisek: "Datum příští revize", hodnota: hd(ctx, z.datumPristiRevize, "[DATUM PŘÍŠTÍ REVIZE]") },
    ]),
    poznamka(
      "Pravidelná revize musí být provedena v roce, do kterého spadá konec stanovené lhůty od doby provedení poslední revize. Netýká se lhůt nepřesahujících délku jednoho roku. Provozovatel se zpracovaným řádem preventivní údržby může stanovit lhůty až dvojnásobné.",
    ),

    nadpisSekce("5. Úkony prohlídek, zkoušek a údržby"),
    tabulka(
      ["Úkon", "Interval", "Provádí", "Záznam"],
      [
        ["Prohlídka — vizuální kontrola stavu zařízení, krytů, označení", hv(ctx, "", "[1× ročně]"), hv(ctx, "", "[OSOBA]"), "Záznam v provozním deníku"],
        ["Ověření funkce ochrany před úrazem elektrickým proudem", hv(ctx, "", "[1× ročně]"), hv(ctx, "", "[OSOBA]"), "Záznam v provozním deníku"],
        ["Ověření funkce proudových chráničů zkušebním tlačítkem", hv(ctx, "", "[1× měsíčně]"), hv(ctx, "", "[OSOBA]"), "Záznam v provozním deníku"],
        ["Kontrola dotažení spojů, stavu svorek a přípojnic", hv(ctx, "", "[1× ročně]"), hv(ctx, "", "[OSOBA]"), "Záznam v provozním deníku"],
        ["Kontrola a čištění chlazení, ventilace a filtrů", hv(ctx, "", "[dle výrobce]"), hv(ctx, "", "[OSOBA]"), "Záznam v provozním deníku"],
        ["Měření izolačního stavu, impedance smyčky a pospojování", hv(ctx, "", "[při revizi]"), hv(ctx, "", "[REVIZNÍ TECHNIK]"), "Zpráva o revizi"],
        ["Vizuální kontrola LPS — není-li viditelně poškozen", "nejméně 1× ročně; u objektů s rizikem výbušných materiálů nejméně 1× za 6 měsíců a úplná revize 1× ročně (příl. 4 NV 190/2022)", hv(ctx, "", "[OSOBA]"), "Záznam v provozním deníku"],
        ["Revize vyhrazeného elektrického zařízení", hv(ctx, "", "[lhůta dle článku 4]"), "Revizní technik s platným osvědčením", "Zpráva o revizi"],
        ["Revize a kontroly elektrických spotřebičů a ručního nářadí", hv(ctx, "", "[dle ČSN 33 1600 ed. 2]"), hv(ctx, "", "[REVIZNÍ TECHNIK]"), "Zpráva o revizi spotřebičů"],
      ],
      { sirky: [42, 24, 18, 16] },
    ),

    nadpisSekce("6. Preventivní údržba"),
    odstavec([
      run("Preventivní údržba se provádí podle pokynů výrobce jednotlivých zařízení obsažených v jejich průvodní dokumentaci, nejpozději však v intervalech uvedených v článku 5. Je-li v průvodní dokumentaci uvedena lhůta kratší, postupuje se podle průvodní dokumentace."),
    ]),
    odrazka([run("Při každé prohlídce se ověří, zda volba zařízení odpovídá provozním podmínkám a zda jsou respektovány požadavky výrobce na montáž a provoz.")]),
    odrazka([run("Zjištěné závady se evidují a odstraňují bez zbytečného odkladu. Stav bezprostředně ohrožující bezpečnost práce nebo provozu se řeší neprodleným odpojením zařízení od napájecího zdroje a zajištěním proti nežádoucímu připojení.")]),
    odrazka([run("Prozatímní zařízení se v době, kdy není používáno, vypíná, pokud tím není ohrožena bezpečnost práce nebo provozu.")]),

    nadpisSekce("7. Evidence výsledků prohlídek, zkoušek a údržby"),
    odstavec([
      run("Výsledky prohlídek, zkoušek a údržby se zaznamenávají do provozního deníku elektrického zařízení. Deník se vede pro každé zařízení samostatně a ukládá se u provozovatele tak, aby byl kdykoli k dispozici orgánům státního dozoru."),
    ]),
    tabulka(
      ["Evidovaný údaj", "Obsah záznamu"],
      [
        ["Datum a čas", "Datum provedení úkonu"],
        ["Druh úkonu", "Prohlídka, zkouška, údržba, oprava, mimořádná událost"],
        ["Provedl", "Jméno a podpis osoby, která úkon provedl"],
        ["Rozsah", "Která část zařízení byla předmětem úkonu"],
        ["Výsledek", "Zjištěný stav, naměřené hodnoty"],
        ["Závada", "Popis zjištěné závady a odkaz na porušený předpis"],
        ["Odstranění", "Datum, způsob a osoba, která závadu odstranila"],
        ["Revize", "Odkaz na zprávu o revizi a její závěr"],
      ],
      { sirky: [26, 74] },
    ),
    odstavceDoBunky(),

    nadpisSekce("8. Osoby a odpovědnosti"),
    tabulkaDvojic([
      { popisek: "Odpovědná osoba (osoba odpovědná za elektrické zařízení)", hodnota: hv(ctx, "", "[JMÉNO, PŘÍJMENÍ, PODPIS POVĚŘENÍ]") },
      { popisek: "Vedoucí elektrotechnik", hodnota: hv(ctx, popisOsoby(osobaStupne(ctx.doplnky, "vedoucí elektrotechnik"), formatDate), "[JMÉNO, PŘÍJMENÍ, ČÍSLO DOKLADU]") },
      { popisek: "Revizní technik", hodnota: hv(ctx, popisOsoby(osobaStupne(ctx.doplnky, "revizní technik"), formatDate), "[JMÉNO, PŘÍJMENÍ, EVIDENČNÍ ČÍSLO OSVĚDČENÍ]") },
      { popisek: "Osoby znalé a osoby poučené", hodnota: hv(ctx, "", "[SEZNAM OSOB A ROZSAH JEJICH ČINNOSTI]") },
    ]),
    odstavec([
      run("Práce na vyhrazeném elektrickém zařízení smí provádět jen odborně způsobilá osoba vybavená osobními ochrannými pracovními prostředky a seznámená s jejich používáním. O tomto seznámení se vyhotoví zápis, který podepíše odborně způsobilá osoba spolu s osobou, která seznámení provedla."),
    ]),

    nadpisSekce("9. Závěrečná ustanovení"),
    odrazka([run("Tento řád nabývá účinnosti dnem "), hv(ctx, datumDokumentu(ctx), "[DATUM]"), run(" a je veden jako součást provozní dokumentace zařízení.")]),
    odrazka([run("Řád se přezkoumává při každé změně zařízení, změně provozních podmínek, po mimořádné revizi, a dále nejméně jednou za "), hv(ctx, "", "[2 roky]"), run(".")]),
    odrazka([run("Řád zpracoval "), hv(ctx, z.zpracovatelJmeno || f.nazev, "[ZPRACOVATEL]"), run(" na základě průvodní dokumentace zařízení a projektu.")]),
    mistoDatum(ctx),
    podpisy(ctx, [
      { role: "Zpracoval", jmeno: z.zpracovatelJmeno || undefined },
      { role: "Provozovatel / odpovědná osoba", placeholder: "[JMÉNO A PODPIS]" },
    ]),
  ];
  return sestavDocx(ctx, "Řád prohlídek, údržby a revizí", deti);
}

// ------------------------------------------------------------------- P2

export async function povereniOdpovedneOsoby(z: Zakazka, f: Firma, o: Moznosti = VYCHOZI_MOZNOSTI): Promise<VysledekNoveho> {
  const ctx = kontext(z, f, o);
  const deti: (Paragraph | Table)[] = [
    ...nadpisDokumentu("Pověření osoby odpovědné za elektrické zařízení", "§ 8 písm. d) NV č. 190/2022 Sb."),
    identifikaceStavby(ctx),
    nadpisSekce("Pověření"),
    odstavec([
      run("Provozovatel elektrického zařízení "),
      hv(ctx, spoj([z.investor, z.investorAdresa]), "[PROVOZOVATEL, SÍDLO]"),
      run(", IČO "),
      hv(ctx, z.investorIco, "[IČO]"),
      run(", tímto pověřuje podle § 8 písm. d) nařízení vlády č. 190/2022 Sb. jako osobu odpovědnou za elektrické zařízení:"),
    ]),
    tabulkaDvojic([
      { popisek: "Jméno a příjmení", hodnota: hv(ctx, "", "[JMÉNO A PŘÍJMENÍ]") },
      { popisek: "Datum narození", hodnota: hv(ctx, "", "[DATUM NAROZENÍ]") },
      { popisek: "Stupeň odborné způsobilosti", hodnota: hv(ctx, "", "[Vedoucí elektrotechnik / revizní technik]") },
      { popisek: "Číslo a rozsah dokladu nebo osvědčení", hodnota: hv(ctx, "", "[ČÍSLO OSVĚDČENÍ, ROZSAH E1/E2/E3 + A/B]") },
      { popisek: "Platnost osvědčení do", hodnota: hv(ctx, "", "[DATUM]") },
    ]),
    nadpisSekce("Rozsah pověření"),
    odstavec([run("Osoba odpovědná za elektrické zařízení zajišťuje bezpečný provoz zařízení v tomto rozsahu:")]),
    odrazka([run("stanovení pravidel při výkonu jednotlivých činností na zařízení a organizace nebo uspořádání místa výkonu těchto činností;")]),
    odrazka([run("kontrola, aby činnosti a řízení činností na zařízení a v jeho blízkosti vykonávaly jen osoby odborně způsobilé k dané činnosti;")]),
    odrazka([run("zajištění pravidelného školení odborně způsobilých osob o právních a ostatních předpisech, není-li zpracován vnitřní předpis, nejméně jednou ročně;")]),
    odrazka([run("vedení a přezkoumávání řádu prohlídek, údržby a revizí a zajištění lhůt revizí;")]),
    odrazka([run("vedení evidence výsledků prohlídek, zkoušek, údržby a evidence zjištěných a odstraněných závad;")]),
    odrazka([run("rozhodnutí o ponechání prozatímního zařízení v provozu, pokud by jeho vypnutí ohrozilo bezpečnost práce nebo provozu;")]),
    odrazka([run("evidence a kontrola platnosti osvědčení a zdravotní způsobilosti osob, které na zařízení vykonávají činnost.")]),
    nadpisSekce("Povinnosti pověřené osoby"),
    odstavec([
      run("Pověřená osoba odpovídá za dodržování právních a ostatních předpisů k zajištění bezpečnosti a ochrany zdraví při práci. Je povinna bez zbytečného odkladu oznámit provozovateli skutečnosti, které brání výkonu pověření, zejména pozbytí platnosti osvědčení nebo zdravotní nezpůsobilost."),
    ]),
    nadpisSekce("Platnost pověření"),
    platnostPovereni(ctx),
    mistoDatum(ctx),
    podpisy(ctx, [
      { role: "Provozovatel", jmeno: z.investorZastupce || z.investor || undefined },
      { role: "Pověřená osoba — pověření přijímám", placeholder: "[JMÉNO A PODPIS]" },
    ]),
  ];
  return sestavDocx(ctx, "Pověření osoby odpovědné za elektrické zařízení", deti);
}

// ------------------------------------------------------------------- P3

export async function vyhodnoceniRizika(z: Zakazka, f: Firma, o: Moznosti = VYCHOZI_MOZNOSTI): Promise<VysledekNoveho> {
  const ctx = kontext(z, f, o);
  const deti: (Paragraph | Table)[] = [
    ...nadpisDokumentu("Zápis o vyhodnocení elektrického rizika", "§ 8 písm. b) NV č. 190/2022 Sb."),
    identifikaceStavby(ctx),
    tabulkaDvojic([
      { popisek: "Datum vyhodnocení", hodnota: hv(ctx, datumDokumentu(ctx), "[DATUM]") },
      { popisek: "Vyhodnocení provedl", hodnota: hv(ctx, "", "[JMÉNO A PŘÍJMENÍ, FUNKCE]") },
      { popisek: "Předmět činnosti", hodnota: hv(ctx, "", "[PRÁCE / OBSLUHA, KTERÉ MAJÍ BÝT VYKONÁNY]") },
      { popisek: "Odpovědná osoba", hodnota: hv(ctx, z.zakaznikZastupce || z.investorZastupce, "[JMÉNO A PŘÍJMENÍ]") },
    ]),
    nadpisSekce("1. Předmět a účel vyhodnocení"),
    odstavec([
      run("Před zahájením práce na vyhrazeném elektrickém zařízení nebo jeho obsluhy se vyhodnotí elektrické riziko. Na základě vyhodnocení se stanoví, jak budou práce nebo obsluha vykonávány a jaká opatření budou pro zajištění bezpečnosti provedena."),
    ]),
    nadpisSekce("2. Popis zařízení a pracoviště"),
    tabulkaDvojic([
      { popisek: "Popis zařízení", hodnota: hv(ctx, spoj([z.profese, z.soustava]), "[POPIS ELEKTRICKÉHO ZAŘÍZENÍ]") },
      { popisek: "Umístění", hodnota: hv(ctx, z.adresaStavby, "[MÍSTO PRÁCE]") },
      { popisek: "Napěťová soustava", hodnota: hv(ctx, spoj([z.soustava, z.jistic ? `hlavní jistič ${z.jistic}` : ""]), "[SOUSTAVA, JIŠTĚNÍ]") },
      { popisek: "Druh prostředí a vnější vlivy", hodnota: hv(ctx, "", "[VNĚJŠÍ VLIVY — odkaz na protokol o určení vnějších vlivů]") },
      { popisek: "Stav zařízení", hodnota: hv(ctx, "", "[BEZ NAPĚTÍ / POD NAPĚTÍM / ČÁSTEČNĚ]") },
    ]),
    nadpisSekce("3. Identifikace nebezpečí"),
    tabulka(
      ["Nebezpečí", "Zdroj", "Pravděpodobnost", "Závažnost", "Míra rizika"],
      [
        ["Úraz elektrickým proudem — přímý dotyk živé části", hv(ctx, "", "[POPIS]"), hv(ctx, "", "[NÍZKÁ / STŘEDNÍ / VYSOKÁ]"), hv(ctx, "", "[NÍZKÁ / STŘEDNÍ / VYSOKÁ]"), hv(ctx, "", "[PŘIJATELNÁ / NEPŘIJATELNÁ]")],
        ["Úraz elektrickým proudem — nepřímý dotyk, porucha izolace", hv(ctx, "", "[POPIS]"), hv(ctx, "", "[—]"), hv(ctx, "", "[—]"), hv(ctx, "", "[—]")],
        ["Elektrický oblouk a výbuch — zkrat, spínání", hv(ctx, "", "[POPIS]"), hv(ctx, "", "[—]"), hv(ctx, "", "[—]"), hv(ctx, "", "[—]")],
        ["Požár od elektrického zařízení", hv(ctx, "", "[POPIS]"), hv(ctx, "", "[—]"), hv(ctx, "", "[—]"), hv(ctx, "", "[—]")],
        ["Pád z výšky, mechanické nebezpečí", hv(ctx, "", "[POPIS]"), hv(ctx, "", "[—]"), hv(ctx, "", "[—]"), hv(ctx, "", "[—]")],
        ["Výbuch — prostředí s nebezpečím výbuchu", hv(ctx, "", "[POPIS]"), hv(ctx, "", "[—]"), hv(ctx, "", "[—]"), hv(ctx, "", "[—]")],
      ],
      { sirky: [28, 16, 19, 17, 20] },
    ),
    nadpisSekce("4. Opatření k zajištění bezpečnosti"),
    tabulka(
      ["Opatření", "Způsob provedení", "Odpovídá"],
      [
        ["Vypnutí a zajištění proti opětovnému zapnutí", hv(ctx, "", "[ZPŮSOB]"), hv(ctx, "", "[OSOBA]")],
        ["Ověření beznapěťového stavu", hv(ctx, "", "[ZPŮSOB, PŘÍSTROJ]"), hv(ctx, "", "[OSOBA]")],
        ["Uzemnění a zkratování pracoviště", hv(ctx, "", "[ZPŮSOB]"), hv(ctx, "", "[OSOBA]")],
        ["Ohraničení pracoviště a výstražné označení", hv(ctx, "", "[ZPŮSOB]"), hv(ctx, "", "[OSOBA]")],
        ["Osobní ochranné pracovní prostředky", hv(ctx, "", "[DRUH OOPP]"), hv(ctx, "", "[OSOBA]")],
        ["Zajištění první pomoci a přivolání záchranné služby", hv(ctx, "", "[ZPŮSOB]"), hv(ctx, "", "[OSOBA]")],
        ["Způsob dorozumívání a spojení", hv(ctx, "", "[ZPŮSOB]"), hv(ctx, "", "[OSOBA]")],
      ],
      { sirky: [40, 38, 22] },
    ),
    nadpisSekce("5. Závěr vyhodnocení"),
    tabulkaDvojic([
      { popisek: "Výsledné riziko", hodnota: hv(ctx, "", "[AKCEPTOVATELNÉ / NEAKCEPTOVATELNÉ]") },
      { popisek: "Podmínky, za kterých lze práci zahájit", hodnota: hv(ctx, "", "[PODMÍNKY]") },
      { popisek: "Osoba, která práce řídí", hodnota: hv(ctx, "", "[VEDOUCÍ PRÁCE]") },
    ]),
    poznamka(
      "Vyhodnocení elektrického rizika se opakuje při každé změně podmínek práce, změně zařízení nebo složení pracovní skupiny.",
    ),
    mistoDatum(ctx),
    podpisy(ctx, [
      { role: "Vyhodnocení provedl", placeholder: "[JMÉNO A PODPIS]" },
      { role: "Odpovědná osoba", jmeno: z.zakaznikZastupce || z.investorZastupce || undefined },
    ]),
  ];
  return sestavDocx(ctx, "Zápis o vyhodnocení elektrického rizika", deti);
}

// ------------------------------------------------------------------- P4

export async function stanoveniVedoucihoPrace(z: Zakazka, f: Firma, o: Moznosti = VYCHOZI_MOZNOSTI): Promise<VysledekNoveho> {
  const ctx = kontext(z, f, o);
  const deti: (Paragraph | Table)[] = [
    ...nadpisDokumentu("Stanovení vedoucího práce", "§ 8 písm. e) NV č. 190/2022 Sb."),
    identifikaceStavby(ctx),
    tabulkaDvojic([
      { popisek: "Datum stanovení", hodnota: hv(ctx, datumDokumentu(ctx), "[DATUM]") },
      { popisek: "Konkrétní práce", hodnota: hv(ctx, "", "[POPIS PRÁCE NA ELEKTRICKÉM ZAŘÍZENÍ]") },
      { popisek: "Místo provedení", hodnota: hv(ctx, z.adresaStavby, "[MÍSTO]") },
      { popisek: "Předpokládaný termín", hodnota: hv(ctx, "", "[OD – DO]") },
    ]),
    nadpisSekce("1. Vedoucí práce"),
    odstavec([run("Pro práci uvedenou výše se stanovuje vedoucí práce:")]),
    tabulkaDvojic([
      { popisek: "Jméno a příjmení", hodnota: hv(ctx, "", "[JMÉNO A PŘÍJMENÍ]") },
      { popisek: "Odborná způsobilost — stupeň", hodnota: hv(ctx, "", "[ELEKTROTECHNIK / VEDOUCÍ ELEKTROTECHNIK / REVIZNÍ TECHNIK — § 5 NV č. 194/2022 Sb.]") },
      { popisek: "Číslo dokladu o odborné způsobilosti", hodnota: hv(ctx, "", "[ČÍSLO DOKLADU]") },
      { popisek: "Platnost dokladu do", hodnota: hv(ctx, "", "[DATUM]") },
      { popisek: "Kontakt", hodnota: hv(ctx, "", "[TELEFON / E-MAIL]") },
    ]),
    nadpisSekce("2. Rozbor složitosti práce"),
    odstavec([
      run("Před zahájením práce se provede rozbor její složitosti, aby byla pro její výkon zvolena osoba s vhodnou odbornou způsobilostí. Vedoucího práce na vyhrazeném elektrickém zařízení může vykonávat pouze osoba znalá (§ 5 NV č. 194/2022 Sb.)."),
    ]),
    tabulka(
      ["Hledisko", "Zjištění"],
      [
        ["Druh a rozsah napětí", hv(ctx, spoj([z.soustava]), "[DO 1 kV / NAD 1 kV]")],
        ["Prostředí a vnější vlivy", hv(ctx, "", "[BEZ NEBEZPEČÍ VÝBUCHU / S NEBEZPEČÍM VÝBUCHU]")],
        ["Stav zařízení při práci", hv(ctx, "", "[BEZ NAPĚTÍ / POD NAPĚTÍM]")],
        ["Souběh s jinými pracemi", hv(ctx, "", "[ANO / NE — POPIS]")],
        ["Požadovaná kvalifikace členů skupiny", hv(ctx, "", "[STUPNĚ ODBORNÉ ZPŮSOBILOSTI]")],
        ["Počet osob ve skupině", hv(ctx, "", "[POČET]")],
      ],
      { sirky: [38, 62] },
    ),
    nadpisSekce("3. Povinnosti a oprávnění vedoucího práce"),
    odrazka([run("řádně zajistit danou činnost, včetně zajištění pracoviště a jeho označení;")]),
    odrazka([run("seznámit všechny osoby s vyhodnocením elektrického rizika a s pracovním postupem;")]),
    odrazka([run("ověřit, že osoby mají platnou odbornou způsobilost a zdravotní způsobilost;")]),
    odrazka([run("kontrolovat dodržování právních a ostatních předpisů po celou dobu práce;")]),
    odrazka([run("přerušit nebo zastavit práci při ohrožení bezpečnosti;")]),
    odrazka([run("zajistit předání pracoviště, provedení zkoušek a záznam o průběhu práce.")]),
    nadpisSekce("4. Osoby a skupina"),
    tabulka(
      ["Jméno a příjmení", "Funkce ve skupině", "Stupeň odborné způsobilosti", "Seznámen (podpis)"],
      [
        [hv(ctx, "", "[JMÉNO A PŘÍJMENÍ]"), "Vedoucí práce", hv(ctx, "", "[STUPEŇ]"), hv(ctx, "", "[PODPIS]")],
        [hv(ctx, "", "[JMÉNO A PŘÍJMENÍ]"), "Člen skupiny", hv(ctx, "", "[STUPEŇ]"), hv(ctx, "", "[PODPIS]")],
        [hv(ctx, "", "[JMÉNO A PŘÍJMENÍ]"), "Člen skupiny", hv(ctx, "", "[STUPEŇ]"), hv(ctx, "", "[PODPIS]")],
      ],
      { sirky: [30, 24, 26, 20] },
    ),
    mistoDatum(ctx),
    podpisy(ctx, [
      { role: "Stanovil — odpovědná osoba", placeholder: "[JMÉNO A PODPIS]" },
      { role: "Vedoucí práce — stanovení přijímám", placeholder: "[JMÉNO A PODPIS]" },
    ]),
  ];
  return sestavDocx(ctx, "Stanovení vedoucího práce", deti);
}

// ------------------------------------------------------------------- P5

export async function zapisOopp(z: Zakazka, f: Firma, o: Moznosti = VYCHOZI_MOZNOSTI): Promise<VysledekNoveho> {
  const ctx = kontext(z, f, o);
  const deti: (Paragraph | Table)[] = [
    ...nadpisDokumentu("Zápis o seznámení s osobními ochrannými pracovními prostředky", "§ 7 odst. 6 NV č. 190/2022 Sb."),
    identifikaceStavby(ctx),
    odstavec([
      run("Podle § 7 odst. 6 nařízení vlády č. 190/2022 Sb. smí práce na vyhrazeném elektrickém zařízení provádět jen odborně způsobilá osoba, která je vybavena potřebnými osobními ochrannými pracovními prostředky a byla seznámena s jejich používáním. O této skutečnosti se vyhotoví zápis."),
    ]),
    tabulkaDvojic([
      { popisek: "Datum seznámení", hodnota: hv(ctx, datumDokumentu(ctx), "[DATUM]") },
      { popisek: "Místo seznámení", hodnota: hv(ctx, z.adresaStavby, "[MÍSTO]") },
      { popisek: "Seznámení provedl", hodnota: hv(ctx, "", "[JMÉNO A PŘÍJMENÍ, FUNKCE, ČÍSLO DOKLADU]") },
      { popisek: "Druh vykonávané činnosti", hodnota: hv(ctx, "", "[MONTÁŽ / OBSLUHA / REVIZE / ÚDRŽBA]") },
    ]),
    nadpisSekce("Vydané osobní ochranné pracovní prostředky"),
    tabulka(
      ["Prostředek", "Typ / provedení", "Norma", "Převzal (podpis)"],
      [
        ["Ochranná přilba elektrotechnická", hv(ctx, "", "[TYP]"), "ČSN EN 397, ČSN EN 50365", hv(ctx, "", "[PODPIS]")],
        ["Ochranné rukavice izolační", hv(ctx, "", "[TŘÍDA 00–4]"), "ČSN EN 60903", hv(ctx, "", "[PODPIS]")],
        ["Ochranný oblek proti elektrickému oblouku", hv(ctx, "", "[TŘÍDA APC]"), "ČSN EN IEC 61482-2", hv(ctx, "", "[PODPIS]")],
        ["Ochranná obuv elektroizolační", hv(ctx, "", "[TYP]"), "ČSN EN 50321-1", hv(ctx, "", "[PODPIS]")],
        ["Ochranné brýle nebo obličejový štít", hv(ctx, "", "[TYP]"), "ČSN EN 166", hv(ctx, "", "[PODPIS]")],
        ["Zkoušečka napětí / indikátor napětí", hv(ctx, "", "[TYP, ROZSAH]"), "ČSN EN 61243", hv(ctx, "", "[PODPIS]")],
        ["Izolační podložka nebo izolační nářadí", hv(ctx, "", "[TYP]"), "ČSN EN 61111, ČSN EN 60900", hv(ctx, "", "[PODPIS]")],
        ["Zkratovací a uzemňovací souprava", hv(ctx, "", "[TYP]"), "ČSN EN 61230", hv(ctx, "", "[PODPIS]")],
      ],
      { sirky: [34, 20, 28, 18] },
    ),
    odstavceDoBunky(),
    nadpisSekce("Seznámení osob"),
    odstavec([
      run("Níže uvedené osoby byly seznámeny s používáním přidělených osobních ochranných pracovních prostředků, s jejich kontrolou před použitím, s lhůtami výměny a se zákazem používat poškozené nebo prošlé prostředky. Seznámení bylo provedeno praktickou ukázkou."),
    ]),
    tabulka(
      ["Jméno a příjmení", "Číslo dokladu o odborné způsobilosti", "Seznámen (podpis)"],
      [
        [hv(ctx, "", "[JMÉNO A PŘÍJMENÍ]"), hv(ctx, "", "[ČÍSLO]"), hv(ctx, "", "[PODPIS]")],
        [hv(ctx, "", "[JMÉNO A PŘÍJMENÍ]"), hv(ctx, "", "[ČÍSLO]"), hv(ctx, "", "[PODPIS]")],
        [hv(ctx, "", "[JMÉNO A PŘÍJMENÍ]"), hv(ctx, "", "[ČÍSLO]"), hv(ctx, "", "[PODPIS]")],
      ],
      { sirky: [40, 34, 26] },
    ),
    poznamka(
      "Kontrola stavu osobních ochranných pracovních prostředků se provádí před každým použitím. Prostředky s prošlou dobou použitelnosti nebo poškozené se neprodleně vyřadí z používání a nahradí.",
    ),
    mistoDatum(ctx),
    podpisy(ctx, [
      { role: "Seznámení provedl", placeholder: "[JMÉNO A PODPIS]" },
      { role: "Odpovědná osoba", jmeno: z.zakaznikZastupce || z.investorZastupce || undefined },
    ]),
  ];
  return sestavDocx(ctx, "Zápis o seznámení s OOPP", deti);
}

// ------------------------------------------------------------------- P6

export async function zapisPouceni(z: Zakazka, f: Firma, o: Moznosti = VYCHOZI_MOZNOSTI): Promise<VysledekNoveho> {
  const ctx = kontext(z, f, o);
  const deti: (Paragraph | Table)[] = [
    ...nadpisDokumentu("Zápis o poučení a ověření znalostí osoby poučené", "§ 4 odst. 3 NV č. 194/2022 Sb."),
    identifikaceStavby(ctx),
    odstavec([
      run("O poučení a ověření znalostí osoby poučené musí být proveden zápis, který vyhotoví osoba znalá, která poučení a ověření provedla. V zápisu musí být přesně vymezen rozsah poučení a specifikace pracovišť."),
    ]),
    tabulkaDvojic([
      { popisek: "Datum poučení", hodnota: hv(ctx, datumDokumentu(ctx), "[DATUM]") },
      { popisek: "Poučení provedl — osoba znalá", hodnota: hv(ctx, "", "[JMÉNO A PŘÍJMENÍ, ČÍSLO DOKLADU]") },
      { popisek: "Pracoviště", hodnota: hv(ctx, z.adresaStavby, "[SPECIFIKACE PRACOVIŠŤ]") },
      { popisek: "Provozovatel zařízení", hodnota: hv(ctx, spoj([z.investor, z.investorIco ? `IČO ${z.investorIco}` : ""]), "[PROVOZOVATEL, IČO]") },
      { popisek: "Rozsah zařízení", hodnota: hv(ctx, spoj([z.profese, z.soustava, z.jistic ? `hlavní jistič ${z.jistic}` : ""]), "[ROZSAH A DRUH ZAŘÍZENÍ]") },
    ]),
    nadpisSekce("Vymezení rozsahu poučení"),
    tabulka(
      ["Okruh poučení", "Obsah"],
      [
        ["Právní a ostatní předpisy", "Zákon č. 250/2021 Sb., NV č. 190/2022 Sb., NV č. 194/2022 Sb., NV č. 378/2001 Sb., zákoník práce"],
        ["Zdroje a příčiny rizik na zařízení", hv(ctx, "", "[POPIS KONKRÉTNÍCH RIZIK]")],
        ["Možné ohrožení elektrickými zařízeními", hv(ctx, "", "[POPIS]")],
        ["Postupy pro poskytnutí první pomoci", "První pomoc při úrazu elektrickým proudem, vyproštění postiženého, přivolání záchranné služby"],
        ["Místní provozní bezpečnostní předpisy", hv(ctx, "", "[OZNAČENÍ A ODKAZ NA DOKUMENT]")],
        ["Obsluha zařízení a přístup k živým částem", hv(ctx, "", "[ROZSAH OBSLUHY]")],
        ["Používání osobních ochranných pracovních prostředků", hv(ctx, "", "[SEZNAM A ZPŮSOB POUŽITÍ]")],
        ["Postup při mimořádné události a požáru", hv(ctx, "", "[POSTUP, ÚNIKOVÉ CESTY]")],
      ],
      { sirky: [34, 66] },
    ),
    odstavceDoBunky(),
    nadpisSekce("Rozsah činností, které může osoba poučená vykonávat"),
    odrazka([run("samostatnou obsluhu elektrického zařízení bez omezení napětí s tím, že se může dotýkat jen těch částí zařízení, které jsou pro obsluhu určeny;")]),
    odrazka([run("práci podle pokynů na elektrických zařízeních malého a nízkého napětí bez napětí a v jejich blízkosti;")]),
    odrazka([run("práci s dohledem na elektrických zařízeních vysokého napětí bez napětí a v jejich blízkosti;")]),
    odrazka([run("práci s dohledem osoby znalé v blízkosti nekrytých živých částí nízkého napětí, v bezpečné vzdálenosti;")]),
    odrazka([run("práci pod dozorem osoby znalé v blízkosti nekrytých živých částí vysokého napětí pod napětím;")]),
    odrazka([run("práci na elektrickém zařízení ve zvláštních případech podle zvláštního pracovního postupu, se kterým byla předem seznámena.")]),
    nadpisSekce("Osoby poučené"),
    tabulka(
      ["Jméno a příjmení", "Činnost", "Znalosti ověřeny (podpis)", "Datum příštího ověření"],
      [
        [hv(ctx, "", "[JMÉNO A PŘÍJMENÍ]"), hv(ctx, "", "[ROZSAH ČINNOSTI]"), hv(ctx, "", "[PODPIS]"), hv(ctx, "", "[DATUM]")],
        [hv(ctx, "", "[JMÉNO A PŘÍJMENÍ]"), hv(ctx, "", "[ROZSAH ČINNOSTI]"), hv(ctx, "", "[PODPIS]"), hv(ctx, "", "[DATUM]")],
        [hv(ctx, "", "[JMÉNO A PŘÍJMENÍ]"), hv(ctx, "", "[ROZSAH ČINNOSTI]"), hv(ctx, "", "[PODPIS]"), hv(ctx, "", "[DATUM]")],
      ],
      { sirky: [30, 26, 24, 20] },
    ),
    viditelnyText(
      "Osoba, jejíž přezkoušení pozbylo platnosti, se považuje za osobu poučenou a může po úspěšném složení zkoušky opět získat stupeň odborné způsobilosti osoby znalé.",
    ),
    mistoDatum(ctx),
    podpisy(ctx, [
      { role: "Poučení provedl — osoba znalá", placeholder: "[JMÉNO A PODPIS]" },
      { role: "Vedoucí elektrotechnik / odpovědná osoba", placeholder: "[JMÉNO A PODPIS]" },
    ]),
  ];
  return sestavDocx(ctx, "Zápis o poučení a ověření znalostí", deti);
}

// ------------------------------------------------------------- pomocníci

/** Víceřádkový obsah do jedné buňky tabulky. */
function odrazkyDoBunky(polozky: string[]): TextRun[] {
  return polozky.map((p, i) => new TextRun({ text: `• ${p}`, font: "Calibri", size: 19, break: i === 0 ? undefined : 1 }));
}

/** Prázdný odstavec — jen rozestup mezi tabulkami. */
function odstavceDoBunky(): Paragraph {
  return new Paragraph({ children: [new TextRun({ text: "", font: "Calibri", size: 10 })], spacing: { after: 140 } });
}

/** Obyčejný odstavec s textem. */
function viditelnyText(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 120, after: 120, line: 264 },
    children: [new TextRun({ text, font: "Calibri", size: 20, color: "6E6A66" })],
  });
}

/** Řádek s datem a dobou platnosti pověření. */
function platnostPovereni(ctx: Kontext): Paragraph {
  return radek([
    run("Pověření se vydává na dobu "),
    hv(ctx, "", "[N]"),
    run(" let od data vydání a je platné do "),
    hd(ctx, "", "[DATUM]"),
    run("."),
  ]);
}