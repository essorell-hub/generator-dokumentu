/**
 * Mapování polí zakázky na placeholdery v šablonách.
 *
 * Placeholdery jsou v šablonách doslova, např. `[NÁZEV STAVBY]`. Pravidla se
 * uplatňují v pořadí: nejdřív celé klauzule (rozliší jednoznačně i tam, kde se
 * stejný placeholder vyskytuje víckrát s jiným významem), pak jednotlivé
 * placeholdery. Co zůstane, se v dokumentu zvýrazní k doplnění.
 */
import type { Rule } from "./docx";
import { aktivniMeridla, kalibraceDo, predlozkaV, PRAZDNE_DOPLNKY, type Doplnky, type MeridloDoc, type OsobaDoc } from "./nove/doplnky";
import { templateBase64 as t01 } from "./templates/t01";
import { templateBase64 as t02 } from "./templates/t02";
import { templateBase64 as t03 } from "./templates/t03";
import { templateBase64 as t04 } from "./templates/t04";
import { templateBase64 as t05 } from "./templates/t05";
import { templateBase64 as t06 } from "./templates/t06";
import { templateBase64 as t07 } from "./templates/t07";
import { templateBase64 as t08 } from "./templates/t08";
import { templateBase64 as t09 } from "./templates/t09";
import { templateBase64 as t10 } from "./templates/t10";
import { templateBase64 as tN1 } from "./templates/tN1";
import { templateBase64 as tN3 } from "./templates/tN3";
import { templateBase64 as tN5 } from "./templates/tN5";
import { templateBase64 as tN6 } from "./templates/tN6";
import { templateBase64 as tN7 } from "./templates/tN7";
import { templateBase64 as tN9 } from "./templates/tN9";

export interface Firma {
  nazev: string;
  adresa: string;
  ico: string;
  dic: string;
  email: string;
  telefon: string;
  web: string;
  ucet: string;
  zapis: string;
  jednatel: string;
  jednatelFunkce: string;
}

export interface Zakazka {
  id?: number;
  cislo: string;
  revize: string;
  nazevStavby: string;
  nazevObjektu: string;
  poznamka: string;
  adresaStavby: string;
  parcela: string;
  katastr: string;
  kraj: string;
  typStavby: string;
  stupenDokumentace: string;
  castDokumentace: string;
  prilohaVyhlasky: string;
  profese: string;
  investor: string;
  investorAdresa: string;
  investorIco: string;
  investorDic: string;
  investorZastupce: string;
  zakaznik: string;
  zakaznikAdresa: string;
  zakaznikIco: string;
  zakaznikDic: string;
  zakaznikZastupce: string;
  zakaznikKontakt: string;
  projektantJmeno: string;
  projektantAutorizace: string;
  projektantObor: string;
  projektantSpecializace: string;
  zpracovatelJmeno: string;
  elektroTechnikJmeno: string;
  elektroTechnikAutorizace: string;
  datum: string;
  datumMistnihoSetreni: string;
  datumPristiRevize: string;
  cisloZpravy: string;
  cisloNabidky: string;
  cisloDokumentu: string;
  mistoPodpisu: string;
  soustava: string;
  jistic: string;
  rezervovanyPrikon: string;
  vykonFve: string;
  distributor: string;
}

export interface DocDef {
  klic: string;
  nazev: string;
  popis: string;
  slug: string;
  revize: string;
  template: string;
  /** `d` = údaje z provozní agendy (osoby, měřidla) — šablona je použít nemusí. */
  rules: (z: Zakazka, f: Firma, d: Doplnky) => Rule[];
}

// ------------------------------------------------------------- pomocné

/** `2026-10-07` → `07. 10. 2026`; prázdné zůstává prázdné. */
export function formatDate(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((value ?? "").trim());
  if (!m) return (value ?? "").trim();
  return `${m[3]}. ${m[2]}. ${m[1]}`;
}

/** Spojí neprázdné části; když nezbyde nic, vrátí prázdný řetězec. */
export function joinParts(parts: (string | undefined | null)[], sep = ", "): string {
  return parts
    .map((p) => (p ?? "").trim())
    .filter((p) => p !== "")
    .join(sep);
}

const ico = (v: string) => (v.trim() ? `IČO ${v.trim()}` : "");
const dic = (v: string) => (v.trim() ? `DIČ ${v.trim()}` : "");

function r(match: string, value: string): Rule {
  const clean = (value ?? "").trim();
  return { match, value: clean === "" ? null : clean };
}

/**
 * Místo zůstane, ale je „vyřešené“ — další pravidla na něj nedosáhnou. Používá
 * se pro data s jiným významem, než má datum nebo číslo zakázky: lhůty plnění,
 * kalibrace měřidel, datum uvedení do provozu, platnost osvědčení.
 */
function p(match: string, value = "", extra: { occurrence?: number; index?: number } = {}): Rule {
  const clean = value.trim();
  return { match, value: clean === "" ? null : clean, preserve: true, ...extra };
}

/**
 * Hodnoty, které jsou v šabloně v hranatých závorkách, ale nejde o nevyplněná
 * místa — sazba DPH, splatnosti a záruční lhůty jsou dané zákonem nebo obvyklé.
 * V hotovém dokumentu se proto závorky vypustí, ať nezůstávají zvýrazněné.
 */
function obvykleHodnoty(): Rule[] {
  return [
    r("DPH [21] %", "DPH 21 %"),
    r("[14] dnů", "14 dnů"),
    r("[24] měsíců", "24 měsíců"),
    r("do [7] dnů", "do 7 dnů"),
    r("min. [20] %", "min. 20 %"),
  ];
}

/** „3×25“ / „25 A“ → jmenovitý proud a počet fází pro tabulky v dokumentech. */
function jisticInfo(z: Zakazka): { jistic: string; proud: string; faze: string } {
  const t = (z.jistic ?? "").trim();
  const cisla = t.match(/\d+/g) ?? [];
  return {
    jistic: t,
    proud: cisla.length ? cisla[cisla.length - 1] : "",
    faze: /^\s*3\s*[×xX]/.test(t) ? "3f" : /^\s*1\s*[×xX]/.test(t) ? "1f" : "",
  };
}

/** Kratší tvar stupně dokumentace: „povolení stavby“ / „provádění stavby“. */
function stupenKratky(z: Zakazka): string {
  return z.stupenDokumentace.replace(/^\s*dokumentace pro\s*/i, "").trim();
}

/** Systém sítě z hodnoty soustavy — `TN-C-S`, `TN-S` nebo `TT`. */
function soustavaZkratka(z: Zakazka): string {
  const m = /(TN-[A-Z-]+|TT)/.exec(z.soustava ?? "");
  return m ? m[1] : "";
}

function zpracovatel(z: Zakazka): string {
  return z.zpracovatelJmeno || z.projektantJmeno;
}

/** Místo stavby ve tvaru pro záhlaví dokumentů. */
function mistoStavby(z: Zakazka): string {
  return joinParts([z.nazevStavby, z.adresaStavby, z.parcela, z.katastr]);
}

/** Adresa, katastr, parcela — bez názvu stavby. */
function mistoBezNazvu(z: Zakazka): string {
  return joinParts([z.adresaStavby, z.katastr, z.parcela]);
}

function investorRadek(z: Zakazka): string {
  return joinParts([z.investor, ico(z.investorIco), z.investorAdresa]);
}

function firmaRadek(f: Firma): string {
  return joinParts([f.nazev, f.adresa, ico(f.ico)]);
}

/** Záhlaví technických zpráv a záznamů: firma · zakázka · revize. */
function zahlavi(z: Zakazka, f: Firma): string {
  return joinParts(
    [f.nazev, z.cislo ? `zakázka ${z.cislo}` : "", `revize ${z.revize}`],
    "  ·  ",
  );
}

// --------------------------------------------------- sdílená mapa tokenů

function baseTokens(z: Zakazka, f: Firma): Rule[] {
  return [
    // firma (zhotovitel)
    r("[NÁZEV FIRMY]", f.nazev),
    r("[NÁZEV FIRMY / REVIZNÍ TECHNIK]", f.nazev),
    r("[NÁZEV FIRMY / JMÉNO]", f.nazev),
    r("[NÁZEV FIRMY, ADRESA, IČO]", firmaRadek(f)),
    r("[NÁZEV FIRMY, IČO]", joinParts([f.nazev, ico(f.ico)])),
    r("[NÁZEV, IČO, číslo oprávnění k montáži]", joinParts([f.nazev, ico(f.ico)])),
    r("[NÁZEV, IČO]", joinParts([f.nazev, ico(f.ico)])),
    r("[ADRESA SÍDLA]", f.adresa),
    r("[IČO]", f.ico),
    r("[DIČ]", f.dic),
    r("[E-MAIL]", f.email),
    r("[TELEFON]", f.telefon),
    r("[ČÍSLO ÚČTU]", f.ucet),
    r("[OR / ŽR]", f.zapis),

    // zakázka
    r("[NÁZEV STAVBY]", z.nazevStavby),
    r("[NÁZEV ZAKÁZKY]", z.nazevStavby),
    r("[NÁZEV STAVBY / OBJEKTU]", z.nazevObjektu || z.nazevStavby),
    r("[NÁZEV A ADRESA OBJEKTU / ZAŘÍZENÍ]",
      joinParts([z.nazevObjektu || z.nazevStavby, z.adresaStavby])),
    r("[NÁZEV A ADRESA VÝROBNY / OBJEKTU]", joinParts([z.nazevStavby, z.adresaStavby])),
    r("[NÁZEV A ADRESA STAVBY, PARCELA, KATASTRÁLNÍ ÚZEMÍ]", mistoStavby(z)),
    r("[NÁZEV A UMÍSTĚNÍ OBJEKTU / PROSTORU]", z.nazevObjektu),
    r("[NÁZEV A ADRESA OBJEKTU]", joinParts([z.nazevObjektu || z.nazevStavby, z.adresaStavby])),
    r("[ADRESA STAVBY]", z.adresaStavby),
    r("[MÍSTO]", z.mistoPodpisu),
    r("[RRRR-NNN]", z.cislo),
    r("[RRRR-NNN-REV]", z.cisloZpravy),
    r("[RRRR-NNN-N]", z.cisloNabidky),
    r("[RRRR-NNN-R-01-EL-TZ-01]", z.cisloDokumentu),
    r("[RRRR-NNN-VV-01]", z.cislo ? `${z.cislo}-VV-01` : ""),
    r("[RRRR-NNN-LPS-REV]", z.cislo ? `${z.cislo}-LPS-REV` : ""),
    r("[00]", z.revize),
    r("[01]", z.revize),
    r("[02]", z.revize),
    r("[DD. MM. RRRR]", formatDate(z.datum)),
    r("[DATUM]", formatDate(z.datumMistnihoSetreni)),
    r("[1 / 8 / 9]", z.prilohaVyhlasky),
    r("[D.1.2.5 TPS – Silnoproud / D.1.2.8 Měření a regulace]", z.castDokumentace),
    r("[D.1.2.5 TPS – Silnoproud / D.1.2.8 MaR]", z.castDokumentace),
    r("[ELEKTROINSTALACE / FVE / LPS / MaR]", z.profese),
    r("[dokumentace pro povolení stavby / dokumentace pro provádění stavby]", z.stupenDokumentace),
    r("[povolení stavby / provádění stavby]", stupenKratky(z)),
    r("[3 N PE AC 400/230 V, 50 Hz, TN-C-S / TN-S / TT]", z.soustava),
    r("[TN-C-S / TN-S / TT]", soustavaZkratka(z)),
    r("[DISTRIBUTOR]", z.distributor),
    r("[Rodinný dům / bytový dům / rekonstrukce bytu]", z.typStavby),
    r("[nová stavba / změna dokončené stavby; trvalá / dočasná stavba; účel užívání]", z.typStavby),

    // místo a investor
    r("[NÁZEV A MÍSTO STAVBY, PARCELA, KATASTRÁLNÍ ÚZEMÍ]", mistoStavby(z)),
    r("[NÁZEV A MÍSTO STAVBY, ČÍSLO PARCELY, KATASTRÁLNÍ ÚZEMÍ]", mistoStavby(z)),
    r("[NÁZEV A ADRESA, PARCELA, KATASTRÁLNÍ ÚZEMÍ]", mistoStavby(z)),
    r("[ADRESA, KATASTRÁLNÍ ÚZEMÍ, PARCELA]", mistoBezNazvu(z)),
    r("[ADRESA, KATASTRÁLNÍ ÚZEMÍ, PARCELNÍ ČÍSLA]", mistoBezNazvu(z)),
    r(
      "[kraj, katastrální území, parcelní čísla pozemků, u budov adresa a čísla popisná]",
      joinParts([z.kraj, z.katastr, z.parcela, z.adresaStavby]),
    ),
    r("[JMÉNO / NÁZEV, ADRESA]", joinParts([z.investor, z.investorAdresa])),
    r("[NÁZEV / JMÉNO, ADRESA]", joinParts([z.investor, z.investorAdresa])),
    r("[NÁZEV / JMÉNO, IČO, ADRESA]",
      joinParts([
        z.zakaznik || z.investor,
        ico(z.zakaznikIco || z.investorIco),
        z.zakaznikAdresa || z.investorAdresa,
      ])),
    r("[JMÉNO / NÁZEV, IČO]",
      joinParts([z.zakaznik || z.investor, ico(z.zakaznikIco || z.investorIco)])),
    r("[JMÉNO / NÁZEV, KONTAKT]", joinParts([z.investor, z.investorZastupce])),
    r(
      "[název a sídlo PO / jméno, příjmení a adresa podnikání FO]",
      joinParts([z.investor, z.investorAdresa]),
    ),
    r("[obchodní firma / jméno, IČO, sídlo]", investorRadek(z)),
    r("[označení provozního souboru, rozvaděče, rozsah napětí]", joinParts([z.nazevObjektu, z.soustava])),
    r("[JMÉNO / NÁZEV ZÁKAZNÍKA]", z.zakaznik || z.investor),
    r("[IČO / DIČ]", joinParts([z.zakaznikIco ? `IČO ${z.zakaznikIco}` : "", z.zakaznikDic ? `DIČ ${z.zakaznikDic}` : ""])),

    // osoby
    r("[JMÉNO]", z.projektantJmeno),
    r("[OBOR]", z.projektantObor),
    r("[SPECIALIZACE]", z.projektantSpecializace),
  ];
}

// ------------------------------------------------------- jednotlivé šablony

/** Jméno bez titulů a čárek, malými písmeny — pro párování osoby z evidence. */
function holeJmeno(jmeno: string): string {
  return jmeno
    .toLowerCase()
    .replace(/,/g, " ")
    .split(/\s+/)
    .filter((c) => c && !c.includes("."))
    .join(" ");
}

/**
 * Revizní technik z evidence osob. Je-li v zakázce zadané jméno, musí sedět —
 * jinak by se do zprávy dostalo osvědčení jiné osoby. Bez jména se vezme
 * první aktivní revizní technik.
 */
function reviznitechnik(z: Zakazka, d: Doplnky): OsobaDoc | undefined {
  const rt = d.osoby.filter((o) => o.aktivni && o.stupen === "revizní technik" && o.jmeno.trim());
  const hledane = holeJmeno(z.elektroTechnikJmeno);
  if (!hledane) return rt[0];
  return rt.find((o) => holeJmeno(o.jmeno) === hledane);
}

/** Řádky tabulky „Použité měřicí přístroje“ v šabloně 01 a jak k nim najít přístroj z evidence. */
const RADKY_MERIDEL: RegExp[] = [/multifunk|instalac|revizní přístroj/i, /zemn|uzemn/i];

function meridlaProRadky(d: Doplnky): (MeridloDoc | undefined)[] {
  const volna = [...aktivniMeridla(d)];
  const vezmi = (test: (m: MeridloDoc) => boolean) => {
    const i = volna.findIndex(test);
    return i === -1 ? undefined : volna.splice(i, 1)[0];
  };
  const radky = RADKY_MERIDEL.map((re) => vezmi((m) => re.test(m.nazev)));
  radky.push(vezmi(() => true)); // třetí řádek „[JINÉ]“ — první zbývající přístroj
  return radky;
}

function typASn(m: MeridloDoc | undefined): string {
  if (!m) return "";
  const typ = joinParts([m.vyrobce, m.typ], " ");
  return joinParts([typ, m.vyrobniCislo ? `v. č. ${m.vyrobniCislo}` : ""]);
}

function rules01(z: Zakazka, f: Firma, d: Doplnky = PRAZDNE_DOPLNKY): Rule[] {
  const jistic = jisticInfo(z);
  const rt = reviznitechnik(z, d);
  const meridla = meridlaProRadky(d);
  // osvědčení RT: znaky podle přílohy č. 5 NV č. 190/2022 Sb. (E1/E2/E3, A/B);
  // co v evidenci chybí, zůstane jako placeholder k doplnění
  const osvedceni = rt
    ? [
        `ev. č. ${rt.cisloDokladu.trim() || "[ČÍSLO]"}`,
        `rozsah ${rt.rozsah.trim() || "[E1 / E2 / E3] · [A / B]"}`,
        `platné do ${formatDate(rt.dokladPlatnostDo) || "[DD. MM. RRRR]"}`,
      ].join(", ")
    : "";
  return [
    // revizní technik — v této zprávě je to jiná osoba než projektant
    r("[JMÉNO A PŘÍJMENÍ]", z.elektroTechnikJmeno || rt?.jmeno || ""),
    r("[X] A, charakteristika [B / C], typ [TYP]",
      jistic.proud ? `${jistic.jistic} A, charakteristika [B / C], typ [TYP]` : ""),
    // p(): bez údaje místo zůstane k doplnění — obecné pravidlo by sem jinak
    // propsalo číslo a datum zakázky
    p("ev. č. [ČÍSLO], rozsah [E1 / E2 / E3] · [A / B], platné do [DD. MM. RRRR]", osvedceni),
    p("Doporučená lhůta příští revize — nejpozději do: [DD. MM. RRRR]",
      formatDate(z.datumPristiRevize)
        ? `Doporučená lhůta příští revize — nejpozději do: ${formatDate(z.datumPristiRevize)}`
        : ""),
    // měřicí přístroje z evidence; kalibrace jsou holá data v tabulce, takže
    // nesmějí dostat datum zakázky ani tehdy, když přístroj v evidenci není
    r3("[TYP, SN]", typASn(meridla[0]), { occurrence: 0 }),
    r3("[TYP, SN]", typASn(meridla[1]), { occurrence: 1 }),
    r3("[TYP, SN]", typASn(meridla[2]), { occurrence: 2 }),
    r("[JINÉ]", meridla[2]?.nazev ?? ""),
    p("[DD. MM. RRRR]", meridla[0] ? formatDate(kalibraceDo(meridla[0])) : "", { occurrence: 5 }),
    p("[DD. MM. RRRR]", meridla[1] ? formatDate(kalibraceDo(meridla[1])) : "", { occurrence: 6 }),
    p("[DD. MM. RRRR]", meridla[2] ? formatDate(kalibraceDo(meridla[2])) : "", { occurrence: 7 }),
    ...baseTokens(z, f),
  ];
}

function rules02(z: Zakazka, f: Firma): Rule[] {
  const projektant = joinParts([
    z.projektantJmeno,
    z.projektantAutorizace ? `autorizace ČKAIT / ČKA č. ${z.projektantAutorizace}` : "",
    z.projektantObor ? `obor ${z.projektantObor}` : "",
    z.projektantSpecializace ? `specializace ${z.projektantSpecializace}` : "",
  ]);
  const elektro = joinParts([
    z.elektroTechnikJmeno,
    z.elektroTechnikAutorizace ? `autorizace č. ${z.elektroTechnikAutorizace}` : "",
    z.projektantObor ? `obor ${z.projektantObor}` : "",
  ]);
  return [
    r("[JMÉNO], autorizace ČKAIT / ČKA č. [ČÍSLO], obor [OBOR], specializace [SPECIALIZACE]", projektant),
    r("[JMÉNO], autorizace č. [ČÍSLO], obor [OBOR]", elektro),
    r("[přípojka NN, rezervovaný příkon [X] kW, jistič [X] A, distributor]",
      joinParts([
        "přípojka NN",
        z.rezervovanyPrikon ? `rezervovaný příkon ${z.rezervovanyPrikon} kW` : "",
        z.jistic ? `jistič ${z.jistic} A` : "",
        z.distributor,
      ])),
    r("Zpracoval: [JMÉNO]", zpracovatel(z) ? `Zpracoval: ${zpracovatel(z)}` : ""),
    ...baseTokens(z, f),
  ];
}

function rules03(z: Zakazka, f: Firma): Rule[] {
  const hlavni = joinParts([
    z.projektantJmeno,
    z.projektantAutorizace ? `autorizace ČKAIT č. ${z.projektantAutorizace}` : "",
  ]);
  return [
    r("[NÁZEV FIRMY]  ·  zakázka [RRRR-NNN]  ·  revize [00]", zahlavi(z, f)),
    // odpovědný projektant a hlavní projektant jsou dva shodné odstavce za sebou
    r3("[JMÉNO], autorizace ČKAIT č. [ČÍSLO]", hlavni, { occurrence: 0 }),
    r3("[JMÉNO], autorizace ČKAIT č. [ČÍSLO]", hlavni, { occurrence: 1 }),
    r("Zpracoval: [JMÉNO]", zpracovatel(z) ? `Zpracoval: ${zpracovatel(z)}` : ""),
    ...baseTokens(z, f),
  ];
}

function rules04(z: Zakazka, f: Firma): Rule[] {
  const autorizace = z.projektantAutorizace ? `autorizace ČKAIT č. ${z.projektantAutorizace}` : "";
  const jistic = jisticInfo(z);
  return [
    r("[JMÉNO], autorizace ČKAIT č. [ČÍSLO]", joinParts([z.projektantJmeno, autorizace])),
    r("[X] A, charakteristika [B / C], [3f / 1f]",
      jistic.proud
        ? `${jistic.jistic} A, charakteristika [B / C]${jistic.faze ? `, ${jistic.faze}` : ", [3f / 1f]"}`
        : ""),
    r("Zpracoval: [JMÉNO]", zpracovatel(z) ? `Zpracoval: ${zpracovatel(z)}` : ""),
    // třetí výskyt `[X] kW` v tabulce bilance patří rezervovanému příkonu
    // (1. je instalovaný příkon Pi, 2. soudobý příkon Ps)
    r3("[X] kW", z.rezervovanyPrikon ? `${z.rezervovanyPrikon} kW` : "", { occurrence: 2 }),
    ...baseTokens(z, f),
  ];
}

function rules05(z: Zakazka, f: Firma): Rule[] {
  return [
    r("[ADRESA]", f.adresa),
    r("[Fotovoltaická elektrárna [X] kWp a ochrana před bleskem a přepětím]",
      z.vykonFve ? `Fotovoltaická elektrárna ${z.vykonFve} kWp a ochrana před bleskem a přepětím` : ""),
    r("[JMÉNO], autorizace ČKAIT / ČKA č. [ČÍSLO], obor [OBOR]",
      joinParts([
        z.projektantJmeno,
        z.projektantAutorizace ? `autorizace ČKAIT / ČKA č. ${z.projektantAutorizace}` : "",
        z.projektantObor ? `obor ${z.projektantObor}` : "",
      ])),
    r("[JMÉNO], autorizace č. [ČÍSLO], obor elektrotechnická zařízení",
      joinParts([
        z.elektroTechnikJmeno,
        z.elektroTechnikAutorizace ? `autorizace č. ${z.elektroTechnikAutorizace}` : "",
        "obor elektrotechnická zařízení",
      ])),
    r("[JMÉNO] / [JMÉNO]", joinParts([z.projektantJmeno, z.elektroTechnikJmeno], " / ")),
    r("[DD. MM. RRRR] / [00]", joinParts([formatDate(z.datum), z.revize], " / ")),
    ...baseTokens(z, f),
  ];
}

function rules06(z: Zakazka, f: Firma): Rule[] {
  return [
    r("[Fotovoltaická elektrárna [X] kWp a ochrana před bleskem a přepětím]",
      z.vykonFve ? `Fotovoltaická elektrárna ${z.vykonFve} kWp a ochrana před bleskem a přepětím` : ""),
    r("rezervovaný výkon [X] kW", z.rezervovanyPrikon ? `rezervovaný výkon ${z.rezervovanyPrikon} kW` : ""),
    r("[X] kWp", z.vykonFve ? `${z.vykonFve} kWp` : ""),
    r("[JMÉNO], autorizace ČKAIT č. [ČÍSLO]",
      joinParts([
        z.projektantJmeno,
        z.projektantAutorizace ? `autorizace ČKAIT č. ${z.projektantAutorizace}` : "",
      ])),
    r("Zpracoval: [JMÉNO]", zpracovatel(z) ? `Zpracoval: ${zpracovatel(z)}` : ""),
    ...baseTokens(z, f),
  ];
}

function rules07(z: Zakazka, f: Firma): Rule[] {
  const popis = z.vykonFve
    ? `Projektová dokumentace fotovoltaické elektrárny o výkonu ${z.vykonFve} kWp včetně hromosvodu a uzemnění${z.adresaStavby ? `, objekt ${z.adresaStavby}` : ""}.`
    : "";
  return [
    // patička nese adresu firmy, ne zákazníka — musí být dřív než [ADRESA] níž
    r("[NÁZEV FIRMY] · [ADRESA] · IČO [IČO] · [E-MAIL] · [TELEFON]",
      joinParts([f.nazev, f.adresa, ico(f.ico), f.email, f.telefon], " · ")),
    r("[ADRESA]", z.zakaznikAdresa || z.investorAdresa),
    r("[Stručný popis zakázky, např.: Projektová dokumentace fotovoltaické elektrárny o výkonu [X] kWp včetně hromosvodu a uzemnění, objekt [ADRESA STAVBY].]", popis),
    r("[JMÉNO A PŘÍJMENÍ], autorizovaný technik / inženýr ČKAIT",
      z.projektantJmeno ? `${z.projektantJmeno}, autorizovaný technik / inženýr ČKAIT` : ""),
    r("[ČÍSLO]", z.projektantAutorizace),
    r("[JMÉNO, TELEFON, E-MAIL]", joinParts([z.projektantJmeno, f.telefon, f.email])),
    ...obvykleHodnoty(),
    ...baseTokens(z, f),
  ];
}

function rules10(z: Zakazka, f: Firma): Rule[] {
  const zhotovitel = joinParts([
    f.nazev,
    f.adresa ? `se sídlem ${f.adresa}` : "",
    ico(f.ico),
    dic(f.dic),
    f.zapis ? `zapsán v ${f.zapis}` : "",
    f.jednatel ? `zastoupen: ${f.jednatel}` : "",
    f.ucet ? `bankovní spojení: ${f.ucet}` : "",
    z.projektantAutorizace ? `autorizace ČKAIT č. ${z.projektantAutorizace}` : "",
  ]);
  const objednatel = joinParts([
    z.zakaznik || z.investor,
    z.zakaznikAdresa || z.investorAdresa ? `se sídlem / bytem ${z.zakaznikAdresa || z.investorAdresa}` : "",
    ico(z.zakaznikIco || z.investorIco),
    dic(z.zakaznikDic || z.investorDic),
    z.zakaznikZastupce || z.investorZastupce ? `zastoupen: ${z.zakaznikZastupce || z.investorZastupce}` : "",
    z.zakaznikKontakt ? `kontakt: ${z.zakaznikKontakt}` : "",
  ]);
  return [
    r("V [MÍSTO]", z.mistoPodpisu ? `${predlozkaV(z.mistoPodpisu)} ${z.mistoPodpisu}` : ""),
    r("[NÁZEV FIRMY]  ·  [ADRESA]  ·  IČO [IČO]", joinParts([f.nazev, f.adresa, ico(f.ico)], "  ·  ")),
    r("[NÁZEV FIRMY / JMÉNO], se sídlem [ADRESA], IČO: [IČO], DIČ: [DIČ], zapsán v [OR / ŽR], zastoupen: [JMÉNO], bankovní spojení: [ČÍSLO ÚČTU], autorizace ČKAIT č. [ČÍSLO]", zhotovitel),
    r("[NÁZEV / JMÉNO], se sídlem / bytem [ADRESA], IČO: [IČO], DIČ: [DIČ], zastoupen: [JMÉNO], kontakt: [E-MAIL, TELEFON]", objednatel),
    // splatnosti a sazba DPH jsou obvyklé hodnoty — zůstávají bez závorek
    p("Objednatel uhradí zálohu [X] % ceny do [14] dnů od podpisu smlouvy. Doplatek je splatný do [14] dnů od vystavení faktury po předání díla.",
      "Objednatel uhradí zálohu [X] % ceny do 14 dnů od podpisu smlouvy. Doplatek je splatný do 14 dnů od vystavení faktury po předání díla."),
    
    r3("............................................[JMÉNO, FUNKCE]", f.jednatel ? `............................................${joinParts([f.jednatel, f.jednatelFunkce])}` : "", { occurrence: 0 }),
    r3("............................................[JMÉNO, FUNKCE]", z.zakaznikZastupce || z.investorZastupce ? `............................................${z.zakaznikZastupce || z.investorZastupce}` : "", { occurrence: 1 }),
    // termín předání díla je lhůta ze smlouvy, ne datum zpracování
    p("Dílo bude předáno do [DD. MM. RRRR] / do [X] pracovních dnů od zahájení."),
    ...obvykleHodnoty(),
    ...baseTokens(z, f),
  ];
}

function rules08(z: Zakazka, f: Firma): Rule[] {
  return [
    r("[RRRR-NNN] [NÁZEV]", joinParts([z.cislo, z.nazevStavby], " ")),
    r("[NÁZEV]", z.nazevStavby),
    ...baseTokens(z, f),
  ];
}

function rules09(z: Zakazka, f: Firma): Rule[] {
  return [
    r("[NÁZEV FIRMY] · IČO [IČO] · [ADRESA SÍDLA]",
      joinParts([f.nazev, ico(f.ico), f.adresa], " · ")),
    r("[RRRR-NNN] ze dne [DD. MM. RRRR]",
      joinParts([
        z.cislo,
        formatDate(z.datum) ? `ze dne ${formatDate(z.datum)}` : "",
      ], " ")),
    r("[NÁZEV ZAKÁZKY, ADRESA STAVBY, STUPEŇ DOKUMENTACE, část dokumentace dle vyhlášky č. 131/2024 Sb.]",
      joinParts([
        z.nazevStavby,
        z.adresaStavby,
        z.stupenDokumentace,
        z.castDokumentace ? `část dokumentace ${z.castDokumentace}` : "",
      ])),
    // dvě řádky „Zaškolená osoba“ — konkrétní lidi doplní uživatel
    r("[JMÉNO]", ""),
    // termín pro odstranění výhrad se odvozuje až z jednání, není to datum zakázky
    p("Termín odstranění výhrad: [DD. MM. RRRR]"),
    ...obvykleHodnoty(),
    ...baseTokens(z, f),
  ];
}

function rulesN1(z: Zakazka, f: Firma): Rule[] {
  return [
    r("[NÁZEV FIRMY]  ·  zakázka [RRRR-NNN]  ·  revize [01]", zahlavi(z, f)),
    r("[NÁZEV STAVBY] · [NÁZEV A UMÍSTĚNÍ OBJEKTU / PROSTORU]",
      joinParts([z.nazevStavby, z.nazevObjektu], " · ")),
    r("[JMÉNO], autorizace ČKAIT č. [ČÍSLO]",
      joinParts([
        z.projektantJmeno,
        z.projektantAutorizace ? `autorizace ČKAIT č. ${z.projektantAutorizace}` : "",
      ])),
    // první datum v tabulce patří místnímu šetření, druhé zpracování protokolu
    { ...p("[DD. MM. RRRR]", formatDate(z.datumMistnihoSetreni)), occurrence: 0 },
    ...baseTokens(z, f),
  ];
}

function rulesN3(z: Zakazka, f: Firma): Rule[] {
  return [
    r("[NÁZEV FIRMY / REVIZNÍ TECHNIK]  ·  č. zprávy [RRRR-NNN-LPS-REV]",
      joinParts([
        f.nazev,
        z.cislo ? `č. zprávy ${z.cislo}-LPS-REV` : "",
      ], "  ·  ")),
    r("[JMÉNO A PŘÍJMENÍ]", z.elektroTechnikJmeno),
    // třída LPS, osvědčení a termíny revize mají vlastní význam, ne datum zakázky
    p("[I / II / III / IV] — podle analýzy rizika ze dne [DD. MM. RRRR]"),
    p("č. [ČÍSLO], rozsah [LPS / E1 / E2], platné do [DD. MM. RRRR]"),
    p("[DD. MM. RRRR] / [DD. MM. RRRR]"),
    r("Další úplná revize LPS musí být provedena nejpozději do: [DD. MM. RRRR]",
      formatDate(z.datumPristiRevize)
        ? `Další úplná revize LPS musí být provedena nejpozději do: ${formatDate(z.datumPristiRevize)}`
        : ""),
    p("Další vizuální kontrola musí být provedena nejpozději do: [DD. MM. RRRR]"),
    ...baseTokens(z, f),
  ];
}

function rulesN6(z: Zakazka, f: Firma): Rule[] {
  return [
    r("[NÁZEV FIRMY]  ·  zakázka [RRRR-NNN]  ·  revize [01]", zahlavi(z, f)),
    r("[ADRESA, PARCELA, KATASTRÁLNÍ ÚZEMÍ]", joinParts([z.adresaStavby, z.parcela, z.katastr])),
    // odpovědná osoba provozovatele — zástupce objednatele s kontaktem
    r("[JMÉNO, FUNKCE, TELEFON, E-MAIL]",
      joinParts([z.zakaznikZastupce || z.investorZastupce, z.zakaznikKontakt])),
    r("[RRRR-NNN] ze dne [DD. MM. RRRR]",
      joinParts([
        z.cislo,
        formatDate(z.datum) ? `ze dne ${formatDate(z.datum)}` : "",
      ], " ")),
    r("[DD. MM. RRRR] / [01]", joinParts([formatDate(z.datum), z.revize], " / ")),
    // datum uvedení do provozu výrobny se doplní ručně, není to datum zpracování
    p("[DD. MM. RRRR]"),
    r("[X] kWp", z.vykonFve ? `${z.vykonFve} kWp` : ""),
    r("[NÁZEV FIRMY / JMÉNO], autorizace č. [ČÍSLO]",
      joinParts([
        f.nazev,
        z.projektantAutorizace ? `autorizace č. ${z.projektantAutorizace}` : "",
      ])),
    r("Rozhodná lhůta pro výrobnu: [X] let.  Příští revize nejpozději do: [DD. MM. RRRR]",
      formatDate(z.datumPristiRevize)
        ? `Rozhodná lhůta pro výrobnu: [X] let.  Příští revize nejpozději do: ${formatDate(z.datumPristiRevize)}`
        : ""),
    r("Zpracoval: [JMÉNO]", zpracovatel(z) ? `Zpracoval: ${zpracovatel(z)}` : ""),
    ...baseTokens(z, f),
  ];
}

function rulesN7(z: Zakazka, f: Firma): Rule[] {
  return [
    r("[NÁZEV FIRMY]  ·  zakázka [RRRR-NNN]  ·  revize [01]", zahlavi(z, f)),
    r("[NÁZEV FIRMY / JMÉNO], autorizace č. [ČÍSLO]",
      joinParts([
        f.nazev,
        z.projektantAutorizace ? `autorizace č. ${z.projektantAutorizace}` : "",
      ])),
    // skutečné termíny realizace se liší od data zpracování dokumentace
    p("[DD. MM. RRRR] / [DD. MM. RRRR]"),
    ...baseTokens(z, f),
  ];
}

function rulesN9(z: Zakazka, f: Firma): Rule[] {
  return [
    r("[NÁZEV FIRMY]  ·  zakázka [RRRR-NNN]  ·  revize [01]", zahlavi(z, f)),
    // servis zajišťuje zhotovitel; lektorem je zpracovatel dokumentace
    r("[zhotovitel / servisní organizace]", f.nazev),
    r("[JMÉNO A PŘÍJMENÍ], [funkce, kontakt]",
      joinParts([zpracovatel(z), f.telefon, f.email])),
    r("[NÁZEV FIRMY] · zápis o zaškolení obsluhy · zakázka [RRRR-NNN] — rev. 01/2026",
      joinParts(
        [
          f.nazev,
          "zápis o zaškolení obsluhy",
          z.cislo ? `zakázka ${z.cislo} — rev. ${z.revize}/2026` : "",
        ],
        " · ",
      )),
    r("[RRRR-NNN] [NÁZEV]", joinParts([z.cislo, z.nazevStavby], " ")),
    ...baseTokens(z, f),
  ];
}

function rulesN5(z: Zakazka, f: Firma): Rule[] {
  const jistic = jisticInfo(z);
  return [
    r("[NÁZEV]", z.nazevStavby),
    r("[ ] A", jistic.proud ? `${jistic.proud} A` : ""),
    // role v tabulce účastníků nejsou nevyplněná místa — jména se dopisují
    // do prvního sloupce, ten zůstává zvýrazněný
    p("[zhotovitel — projektant]", "zhotovitel — projektant"),
    p("[zhotovitel — technik]", "zhotovitel — technik"),
    p("[objednatel / zástupce]", "objednatel / zástupce"),
    p("[správce objektu / provozovatel]", "správce objektu / provozovatel"),
    ...baseTokens(z, f),
  ];
}

function r3(
  match: string,
  value: string,
  extra: { occurrence?: number; index?: number },
): Rule {
  return { ...r(match, value), ...extra };
}

// ---------------------------------------------------------------- registry

export const DOCS: DocDef[] = [
  {
    klic: "01",
    nazev: "Revizní zpráva elektrické instalace",
    popis: "Výchozí, pravidelná i mimořádná revize, náležitosti podle § 10 NV č. 190/2022 Sb.",
    slug: "Revizni_zprava_elektricke_instalace",
    revize: "rev-03-2026",
    template: t01,
    rules: rules01,
  },
  {
    klic: "02",
    nazev: "Průvodní list a souhrnná technická zpráva",
    popis: "Průvodní list stavby a souhrnná technická zpráva pro celou zakázku.",
    slug: "Pruvodni_list_a_souhrnna_technicka_zprava",
    revize: "rev-03-2026",
    template: t02,
    rules: rules02,
  },
  {
    klic: "03",
    nazev: "Technická zpráva — měření a regulace (MaR)",
    popis: "Část D.1.2.8 Měření a regulace, náležitosti podle vyhlášky č. 131/2024 Sb.",
    slug: "Tech_zprava_MaR",
    revize: "rev-02-2026",
    template: t03,
    rules: rules03,
  },
  {
    klic: "04",
    nazev: "Technická zpráva — silnoproud",
    popis: "Část D.1.2.5 TPS – Silnoproud, náležitosti podle vyhlášky č. 131/2024 Sb.",
    slug: "Tech_zprava_silnoproud",
    revize: "rev-03-2026",
    template: t04,
    rules: rules04,
  },
  {
    klic: "05",
    nazev: "Titulní list dokumentace",
    popis: "Titulní list s identifikací stavby, dokumentu a zpracovatelů.",
    slug: "Titulni_list_dokumentace",
    revize: "rev-02-2026",
    template: t05,
    rules: rules05,
  },
  {
    klic: "06",
    nazev: "Technická zpráva — FVE a LPS",
    popis: "Fotovoltaická elektrárna a ochrana před bleskem a přepětím.",
    slug: "Tech_zprava_FVE_a_LPS",
    revize: "rev-02-2026",
    template: t06,
    rules: rules06,
  },
  {
    klic: "07",
    nazev: "Cenová nabídka",
    popis: "Nabídka s identifikací zákazníka, předmětem plnění a platebními podmínkami.",
    slug: "Cenova_nabidka",
    revize: "rev-02-2026",
    template: t07,
    rules: rules07,
  },
  {
    klic: "08",
    nazev: "Kontrolní seznam před odevzdáním",
    popis: "Formální náležitosti, podklady, návaznost na vyhlášku a NV č. 190/2022 Sb.",
    slug: "Kontrolni_seznam",
    revize: "rev-03-2026",
    template: t08,
    rules: rules08,
  },
  {
    klic: "09",
    nazev: "Předávací protokol",
    popis: "Předání díla objednateli, seznam dokumentů, zaškolení a výhrady.",
    slug: "Predavaci_protokol",
    revize: "rev-02-2026",
    template: t09,
    rules: rules09,
  },
  {
    klic: "10",
    nazev: "Smlouva o dílo",
    popis: "Smlouva o dílo na zpracování projektové dokumentace.",
    slug: "Smlouva_o_dilo",
    revize: "rev-02-2026",
    template: t10,
    rules: rules10,
  },
  {
    klic: "N1",
    nazev: "Protokol o určení vnějších vlivů",
    popis: "Zatřídění vnějších vlivů podle ČSN 33 2000-5-51 pro každý prostor zvlášť.",
    slug: "Protokol_o_urceni_vnejsich_vlivu",
    revize: "rev-01-2026",
    template: tN1,
    rules: rulesN1,
  },
  {
    klic: "N3",
    nazev: "Zpráva o revizi LPS",
    popis: "Revize systému ochrany před bleskem podle ČSN EN IEC 62305 a NV č. 190/2022 Sb.",
    slug: "Zprava_o_revizi_LPS",
    revize: "rev-01-2026",
    template: tN3,
    rules: rulesN3,
  },
  {
    klic: "N5",
    nazev: "Záznam o místním šetření",
    popis: "Terénní záznam z místního šetření včetně zjištění a omezení.",
    slug: "Zaznam_o_mistnim_setreni",
    revize: "rev-01-2026",
    template: tN5,
    rules: rulesN5,
  },
  {
    klic: "N6",
    nazev: "Provozní řád FVE a řád prohlídek",
    popis: "Provozní dokumentace výrobny, řád prohlídek, údržby a revizí.",
    slug: "Provozni_rad_FVE_a_rad_prohlidek",
    revize: "rev-02-2026",
    template: tN6,
    rules: rulesN6,
  },
  {
    klic: "N7",
    nazev: "Dokumentace skutečného provedení stavby",
    popis: "DSPS — soupis odchylek od projektové dokumentace a skutečné provedení.",
    slug: "Dokumentace_skutecneho_provedeni_stavby",
    revize: "rev-01-2026",
    template: tN7,
    rules: rulesN7,
  },
  {
    klic: "N9",
    nazev: "Zápis o zaškolení obsluhy",
    popis: "Předání provozní dokumentace a zaškolení obsluhy včetně kontaktů na servis.",
    slug: "Zapis_o_zaskoleni_obsluhy",
    revize: "rev-01-2026",
    template: tN9,
    rules: rulesN9,
  },
];

export function docByKlic(klic: string): DocDef | undefined {
  return DOCS.find((d) => d.klic === klic);
}

/** `01_Revizni_zprava_elektricke_instalace_2026-014_rev-03-2026.docx` */
export function fileNameFor(doc: Pick<DocDef, "klic" | "slug" | "revize">, z: Zakazka): string {
  return [doc.klic, doc.slug, z.cislo.trim(), doc.revize].filter((p) => p !== "").join("_") + ".docx";
}

export function templateBytes(doc: DocDef): Uint8Array {
  return Uint8Array.from(atob(doc.template), (c) => c.charCodeAt(0));
}
