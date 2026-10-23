/**
 * Export agendy do XLSX.
 *
 * Drží se struktury firemních souborů rev-02-2026, aby se daly dál používat
 * v Excelu — stejné listy, stejné sloupce, stejné rozbalovací seznamy a stejné
 * vzorce (dopočet termínu revize, kontrola aktuálnosti norem). Do sešitu proto
 * vstupují vzorce, ne dopočítané hodnoty: soubor zůstane „živý“.
 */
import ExcelJS from "exceljs";
import { ANO_NE, DRUHY_REVIZE, STAVY_ZAKAZKY, TYPY_ZAKAZKY } from "./ciselnik";
import {
  type RadekRevize,
  seznamEvidence,
  seznamNormy,
  seznamRevizi,
  seznamTerminu,
} from "./data";

const BRICK = "FFB04A2F";
const BRICK_DEEP = "FF7E3220";
const LINE = "FFE3DCD5";
const INK_SOFT = "FF6E6A66";

type Sloupec = { hlavicka: string; sirka: number; numFmt?: string };

export function zahlavi(ws: ExcelJS.Worksheet, sloupce: Sloupec[], radek: number) {
  ws.getRow(radek).height = 30;
  sloupce.forEach((s, i) => {
    const bunka = ws.getCell(radek, i + 1);
    bunka.value = s.hlavicka;
    bunka.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    bunka.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRICK } };
    bunka.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    bunka.border = { bottom: { style: "thin", color: { argb: BRICK_DEEP } } };
    ws.getColumn(i + 1).width = s.sirka;
  });
}

/** Zapíše textové datum RRRR-MM-DD jako skutečné datum, nebo prázdno. */
export function datum(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

export function ohraniceni(ws: ExcelJS.Worksheet, od: number, do_: number, sloupcu: number) {
  for (let r = od; r <= do_; r += 1) {
    for (let c = 1; c <= sloupcu; c += 1) {
      const b = ws.getCell(r, c);
      b.border = { bottom: { style: "thin", color: { argb: LINE } } };
      b.alignment = { vertical: "top", wrapText: c !== 1 };
    }
    if (r % 2 === 0) {
      for (let c = 1; c <= sloupcu; c += 1) {
        ws.getCell(r, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDFBFA" } };
      }
    }
  }
}

/** exceljs umí validace rozsahu, ale v typové deklaraci je nemá. */
type SValidacemi = { dataValidations: { add: (rozsah: string, pravidlo: object) => void } };

/** Rozbalovací seznam přes celý rozsah (např. E2:E200). */
export function seznam(ws: ExcelJS.Worksheet, rozsah: string, hodnoty: readonly string[]) {
  (ws as unknown as SValidacemi).dataValidations.add(rozsah, {
    type: "list",
    allowBlank: true,
    formulae: [`"${hodnoty.join(",")}"`],
  });
}

// ------------------------------------------------------- 13_Evidence_zakazek

const SLOUPCE_ZAKAZKY: Sloupec[] = [
  { hlavicka: "Číslo zakázky", sirka: 14 },
  { hlavicka: "Název zakázky", sirka: 30 },
  { hlavicka: "Klient", sirka: 16 },
  { hlavicka: "Kontakt", sirka: 22 },
  { hlavicka: "Typ", sirka: 12 },
  { hlavicka: "Stav", sirka: 12 },
  { hlavicka: "Datum poptávky", sirka: 14, numFmt: "yyyy-mm-dd" },
  { hlavicka: "Termín odevzdání", sirka: 15, numFmt: "yyyy-mm-dd" },
  { hlavicka: "Datum předání", sirka: 13, numFmt: "yyyy-mm-dd" },
  { hlavicka: "Revize dokumentace", sirka: 12 },
  { hlavicka: "Datum revize", sirka: 13, numFmt: "yyyy-mm-dd" },
  { hlavicka: "Cena bez DPH (Kč)", sirka: 16, numFmt: "#,##0" },
  { hlavicka: "Číslo faktury", sirka: 14 },
  { hlavicka: "Datum fakturace", sirka: 14, numFmt: "yyyy-mm-dd" },
  { hlavicka: "Datum úhrady", sirka: 13, numFmt: "yyyy-mm-dd" },
  { hlavicka: "Fakturováno", sirka: 12 },
  { hlavicka: "Zaplaceno", sirka: 12 },
  { hlavicka: "Posouzení licence ERÚ", sirka: 18 },
  { hlavicka: "Předání provozní dokumentace", sirka: 20 },
  { hlavicka: "Odkaz na složku", sirka: 22 },
  { hlavicka: "Poznámka", sirka: 30 },
];

const SLOUPCE_REVIZE: Sloupec[] = [
  { hlavicka: "Klient", sirka: 22 },
  { hlavicka: "Objekt / adresa", sirka: 34 },
  { hlavicka: "Druh revize", sirka: 18 },
  { hlavicka: "Datum poslední revize", sirka: 15, numFmt: "yyyy-mm-dd" },
  { hlavicka: "Lhůta podle přílohy č. 4 NV 190/2022 Sb.", sirka: 52 },
  { hlavicka: "Datum příští revize", sirka: 15, numFmt: "yyyy-mm-dd" },
  { hlavicka: "Dní do termínu", sirka: 12 },
  { hlavicka: "Stav", sirka: 14 },
  { hlavicka: "Kontakt", sirka: 24 },
  { hlavicka: "Poznámka", sirka: 30 },
];

/** Vzorec pro dopočet data příští revize z data a textu lhůty. */
function vzorecPristiRevize(radek: number): string {
  const d = `D${radek}`;
  const e = `E${radek}`;
  const hledani = [
    ['"5 let"', 1826],
    ['"4 roky"', 1461],
    ['"3 roky"', 1096],
    ['"2 roky"', 731],
    ['"1 rok"', 365],
    ['"0,5"', 183],
  ] as const;
  let vnoreny = '""';
  for (let i = hledani.length - 1; i >= 0; i -= 1) {
    const [text, dni] = hledani[i];
    vnoreny = `IF(ISNUMBER(SEARCH(${text},${e})),${dni},${vnoreny})`;
  }
  return `IF(OR(${d}="",${e}=""),"",${d}+${vnoreny})`;
}

export async function evidenceXlsx(): Promise<Uint8Array> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Generátor dokumentů — LOSKOT HOZÁKOVÁ";
  wb.created = new Date();

  // ---------------------------------------------------- list Zakázky
  const radky = await seznamEvidence();
  const zs = wb.addWorksheet("Zakázky");
  zahlavi(zs, SLOUPCE_ZAKAZKY, 1);
  zs.views = [{ state: "frozen", xSplit: 2, ySplit: 1 }];
  zs.autoFilter = { from: "A1", to: "U1" };

  radky.forEach((r, i) => {
    const n = i + 2;
    const hodnoty: (string | number | Date | null)[] = [
      r.cislo,
      r.nazev,
      r.klient,
      r.kontakt,
      r.typ,
      r.stav,
      datum(r.datumPoptavky),
      datum(r.terminOdevzdani),
      datum(r.datumPredani),
      r.revizeDokumentace,
      datum(r.datumRevize),
      r.cenaBezDph,
      r.cisloFaktury,
      datum(r.datumFakturace),
      datum(r.datumUhrady),
      r.fakturovano,
      r.zaplaceno,
      r.posouzeniEru,
      r.predaniProvozniDokumentace,
      r.odkazNaSlozku,
      r.poznamka,
    ];
    hodnoty.forEach((v, c) => {
      const bunka = zs.getCell(n, c + 1);
      bunka.value = v === null ? "" : v;
      const fmt = SLOUPCE_ZAKAZKY[c].numFmt;
      if (fmt && v !== "") bunka.numFmt = fmt;
      if (c === 19 && typeof v === "string" && /^https?:/.test(v)) {
        bunka.value = { text: "otevřít složku", hyperlink: v } as ExcelJS.CellHyperlinkValue;
        bunka.font = { color: { argb: BRICK_DEEP }, underline: true };
      }
    });
  });

  const posledniZ = Math.max(radky.length + 1, 200);
  seznam(zs, `E2:E${posledniZ}`, TYPY_ZAKAZKY);
  seznam(zs, `F2:F${posledniZ}`, STAVY_ZAKAZKY);
  seznam(zs, `P2:P${posledniZ}`, ANO_NE);
  seznam(zs, `Q2:Q${posledniZ}`, ANO_NE);
  seznam(zs, `R2:R${posledniZ}`, ANO_NE);
  seznam(zs, `S2:S${posledniZ}`, ANO_NE);
  ohraniceni(zs, 2, Math.max(radky.length + 1, 2), SLOUPCE_ZAKAZKY.length);

  // ------------------------------------------ list Periodické revize
  const revize = await seznamRevizi();
  const rs = wb.addWorksheet("Periodické revize");
  zahlavi(rs, SLOUPCE_REVIZE, 1);
  revize.forEach((r: RadekRevize, i) => {
    const n = i + 2;
    rs.getCell(n, 1).value = r.klient;
    rs.getCell(n, 2).value = r.objekt;
    rs.getCell(n, 3).value = r.druhRevize;
    const d = datum(r.datumPosledniRevize);
    rs.getCell(n, 4).value = d ?? "";
    if (d) rs.getCell(n, 4).numFmt = "yyyy-mm-dd";
    rs.getCell(n, 5).value = r.lhutaPopis;
    const f = rs.getCell(n, 6);
    f.value = { formula: vzorecPristiRevize(n) } as ExcelJS.CellFormulaValue;
    f.numFmt = "yyyy-mm-dd";
    rs.getCell(n, 7).value = {
      formula: `IF(F${n}="","",F${n}-TODAY())`,
    } as ExcelJS.CellFormulaValue;
    rs.getCell(n, 8).value = {
      formula: `IF(G${n}="","",IF(G${n}<0,"PO TERMÍNU",IF(G${n}<=60,"Blíží se","V termínu")))`,
    } as ExcelJS.CellFormulaValue;
    rs.getCell(n, 9).value = r.kontakt;
    rs.getCell(n, 10).value = r.poznamka;
  });
  const posledniR = Math.max(revize.length + 1, 60);
  for (let n = revize.length + 2; n <= posledniR; n += 1) {
    rs.getCell(n, 6).value = { formula: vzorecPristiRevize(n) } as ExcelJS.CellFormulaValue;
    rs.getCell(n, 6).numFmt = "yyyy-mm-dd";
    rs.getCell(n, 7).value = { formula: `IF(F${n}="","",F${n}-TODAY())` } as ExcelJS.CellFormulaValue;
    rs.getCell(n, 8).value = {
      formula: `IF(G${n}="","",IF(G${n}<0,"PO TERMÍNU",IF(G${n}<=60,"Blíží se","V termínu")))`,
    } as ExcelJS.CellFormulaValue;
  }
  seznam(rs, `C2:C${posledniR}`, DRUHY_REVIZE);
  ohraniceni(rs, 2, Math.max(revize.length + 1, 2), SLOUPCE_REVIZE.length);
  const poznamkaR = posledniR + 2;
  rs.mergeCells(poznamkaR, 1, poznamkaR, 10);
  const pk = rs.getCell(poznamkaR, 1);
  pk.value =
    "Firma, která provádí revize, má přirozený obchod v hlídání zákonných lhůt podle přílohy č. 4 NV č. 190/2022 Sb. Sloupec E vyberte z nabídky; datum příští revize a stav se dopočítají automaticky.";
  pk.font = { italic: true, color: { argb: INK_SOFT }, size: 10 };
  pk.alignment = { wrapText: true, vertical: "top" };
  rs.getRow(poznamkaR).height = 30;

  // ------------------------------------------------ list Číselník
  const cs = wb.addWorksheet("Číselník");
  cs.getColumn(1).width = 38;
  cs.getColumn(2).width = 80;
  cs.getCell("A1").value = "Číselník";
  cs.getCell("A1").font = { bold: true, size: 13, color: { argb: BRICK_DEEP } };
  cs.getCell("B1").value = "Hodnoty (pro validaci v listu Zakázky)";
  cs.getCell("B1").font = { bold: true, color: { argb: INK_SOFT } };

  const radkyCiselniku: [string, string][] = [
    ["Typ zakázky", TYPY_ZAKAZKY.join(", ")],
    ["Stav zakázky", STAVY_ZAKAZKY.join(", ")],
    ["Fakturováno", ANO_NE.join(", ")],
    ["Zaplaceno", ANO_NE.join(", ")],
    ["Posouzení licence ERÚ", ANO_NE.join(", ")],
    ["Předání provozní dokumentace", ANO_NE.join(", ")],
    ["Druh revize", DRUHY_REVIZE.join(", ")],
    [
      "Lhůty revizí (NV 190/2022 Sb., příl. 4)",
      "0,5 roku staveniště; 1 rok mokré a pojízdné; 2 roky nad 200 osob a LPS kritické; 3 roky výroba, ubytování, školy, požár a výbuch; 4 roky LPS ostatní; 5 let administrativa",
    ],
  ];
  radkyCiselniku.forEach(([a, b], i) => {
    const n = i + 2;
    cs.getCell(n, 1).value = a;
    cs.getCell(n, 1).font = { bold: true };
    cs.getCell(n, 2).value = b;
    cs.getCell(n, 2).alignment = { wrapText: true, vertical: "top" };
  });
  cs.getCell(radkyCiselniku.length + 3, 1).value =
    "Hodnoty v číselníku jsou zdrojem rozbalovacích seznamů v listech Zakázky a Periodické revize.";
  cs.getCell(radkyCiselniku.length + 3, 1).font = {
    italic: true,
    color: { argb: INK_SOFT },
    size: 10,
  };

  return new Uint8Array((await wb.xlsx.writeBuffer()) as ArrayBuffer);
}

// --------------------------------------------------- Rejstřík použitých norem

const SLOUPCE_NORMY: Sloupec[] = [
  { hlavicka: "Č.", sirka: 5 },
  { hlavicka: "Označení", sirka: 22 },
  { hlavicka: "Název", sirka: 42 },
  { hlavicka: "Edice / rok", sirka: 15 },
  { hlavicka: "Druh", sirka: 13 },
  { hlavicka: "Účinnost od", sirka: 12 },
  { hlavicka: "Přechodné období do", sirka: 15 },
  { hlavicka: "Použití (šablony)", sirka: 17 },
  { hlavicka: "Poslední ověření", sirka: 14, numFmt: "DD.MM.RRRR" },
  { hlavicka: "Ověřil", sirka: 13 },
  { hlavicka: "Stav", sirka: 15 },
  { hlavicka: "Zjištěná edice", sirka: 16 },
  { hlavicka: "Změna?", sirka: 13 },
  { hlavicka: "Stav kontroly", sirka: 15 },
  { hlavicka: "Ověřit", sirka: 9 },
  { hlavicka: "Poznámka", sirka: 34 },
];

export async function normyXlsx(): Promise<Uint8Array> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Generátor dokumentů — LOSKOT HOZÁKOVÁ";
  wb.created = new Date();

  const normy = await seznamNormy();
  const terminy = await seznamTerminu();
  const ws = wb.addWorksheet("Rejstřík norem");

  ws.mergeCells("A1:P1");
  const titul = ws.getCell("A1");
  titul.value = "Rejstřík použitých norem a předpisů";
  titul.font = { bold: true, size: 13, color: { argb: BRICK_DEEP } };
  titul.alignment = { vertical: "middle" };
  ws.getRow(1).height = 24;

  ws.mergeCells("A2:P2");
  const podtitul = ws.getCell("A2");
  podtitul.value =
    "Rejstřík je jediný zdroj pravdy o tom, které normy firma používá. Vygenerováno aplikací Generátor dokumentů.";
  podtitul.font = { size: 10, color: { argb: INK_SOFT } };

  zahlavi(ws, SLOUPCE_NORMY, 4);
  const prvni = 5;
  normy.forEach((r, i) => {
    const n = prvni + i;
    ws.getCell(n, 1).value = r.poradi || i + 1;
    ws.getCell(n, 2).value = r.oznaceni;
    ws.getCell(n, 2).font = { bold: true };
    ws.getCell(n, 3).value = r.nazev;
    ws.getCell(n, 4).value = r.edice;
    ws.getCell(n, 5).value = r.druh;
    ws.getCell(n, 6).value = r.ucinnostOd;
    ws.getCell(n, 7).value = r.prechodneDo;
    ws.getCell(n, 8).value = r.pouziti;
    const d = datum(r.posledniOvereni);
    ws.getCell(n, 9).value = d ?? "";
    if (d) ws.getCell(n, 9).numFmt = "DD.MM.RRRR";
    ws.getCell(n, 10).value = r.overil;
    ws.getCell(n, 11).value = r.stav;
    ws.getCell(n, 12).value = r.zjistenaEdice;
    ws.getCell(n, 13).value = {
      formula: `IF(TRIM(L${n})="","",IF(TRIM(L${n})=TRIM(D${n}),"beze změny","ZMĚNA"))`,
    } as ExcelJS.CellFormulaValue;
    ws.getCell(n, 14).value = {
      formula: `IF(M${n}="ZMĚNA","AKTUALIZOVAT",IF(I${n}="","NEOVĚŘENO",IF(TODAY()-I${n}>365,"PO TERMÍNU","OK")))`,
    } as ExcelJS.CellFormulaValue;
    const odkaz = r.odkazOverit;
    ws.getCell(n, 15).value =
      odkaz && /^https?:/.test(odkaz)
        ? ({ text: "ověřit", hyperlink: odkaz } as ExcelJS.CellHyperlinkValue)
        : "";
    ws.getCell(n, 15).font = { color: { argb: BRICK_DEEP }, underline: true };
    ws.getCell(n, 16).value = r.poznamka;
  });

  const posledni = prvni + Math.max(normy.length, 1) - 1;
  ws.views = [{ state: "frozen", xSplit: 2, ySplit: 4 }];
  ws.autoFilter = { from: `A4`, to: `P${posledni}` };
  ohraniceni(ws, prvni, posledni, SLOUPCE_NORMY.length);

  const poznamka = posledni + 2;
  ws.mergeCells(poznamka, 1, poznamka, 16);
  const pk = ws.getCell(poznamka, 1);
  pk.value =
    "Sloupec „Zjištěná edice“ vyplňte po ověření aktuálního vydání normy. Sloupec „Změna?“ porovná zjištěnou edici se zapsanou, „Stav kontroly“ upozorní na ověření starší než 12 měsíců.";
  pk.font = { italic: true, color: { argb: INK_SOFT }, size: 10 };
  pk.alignment = { wrapText: true, vertical: "top" };
  ws.getRow(poznamka).height = 30;

  // ------------------------------------------ list Automatická kontrola
  const as = wb.addWorksheet("Automatická kontrola");
  as.getColumn(1).width = 42;
  as.getColumn(2).width = 46;
  as.getColumn(3).width = 30;
  as.mergeCells("A1:F1");
  as.getCell("A1").value = "Souhrn stavu rejstříku";
  as.getCell("A1").font = { bold: true, size: 13, color: { argb: BRICK_DEEP } };
  as.mergeCells("A2:F2");
  as.getCell("A2").value =
    "Přehled aktuálnosti norem. Hodnoty se dopočítají z listu Rejstřík norem.";
  as.getCell("A2").font = { size: 10, color: { argb: INK_SOFT } };

  const souhrn: [string, string][] = [
    ["Norem a předpisů v rejstříku", `COUNTA('Rejstřík norem'!B${prvni}:B${posledni})`],
    ["Stav OK (ověřeno v posledních 12 měsících)", `COUNTIF('Rejstřík norem'!N${prvni}:N${posledni},"OK")`],
    ["Po termínu ověření", `COUNTIF('Rejstřík norem'!N${prvni}:N${posledni},"PO TERMÍNU")`],
    ["K aktualizaci (zjištěna jiná edice)", `COUNTIF('Rejstřík norem'!N${prvni}:N${posledni},"AKTUALIZOVAT")`],
  ];
  souhrn.forEach(([popis, vzorec], i) => {
    const n = 4 + i;
    as.getCell(n, 1).value = popis;
    as.getCell(n, 1).font = { bold: true };
    as.getCell(n, 2).value = { formula: vzorec } as ExcelJS.CellFormulaValue;
  });

  const upozorneni = 10;
  as.mergeCells(`A${upozorneni}:F${upozorneni}`);
  const up = as.getCell(upozorneni, 1);
  up.value =
    "Rejstřík vede evidenci a upozorňuje na změny — nenahrazuje odpovědnost projektanta ani revizního technika. Obsahovou změnu normy vždy posoudí odpovědný pracovník.";
  up.font = { italic: true, color: { argb: INK_SOFT }, size: 10 };
  up.alignment = { wrapText: true, vertical: "top" };
  as.getRow(upozorneni).height = 30;

  // ------------------------------------------------ list Termíny a změny
  const tz = wb.addWorksheet("Termíny a změny");
  tz.getColumn(1).width = 14;
  tz.getColumn(2).width = 40;
  tz.getColumn(3).width = 52;
  tz.getColumn(4).width = 14;
  tz.getColumn(5).width = 10;
  tz.mergeCells("A1:E1");
  tz.getCell("A1").value = "Termíny, které nesmí být zmeškány";
  tz.getCell("A1").font = { bold: true, size: 13, color: { argb: BRICK_DEEP } };
  tz.getRow(1).height = 24;
  tz.mergeCells("A2:E2");
  tz.getCell("A2").value = "Přehled přechodných období a změn s dopadem na dokumentaci.";
  tz.getCell("A2").font = { size: 10, color: { argb: INK_SOFT } };
  zahlavi(tz, [
    { hlavicka: "Datum", sirka: 14 },
    { hlavicka: "Co končí / začíná", sirka: 40 },
    { hlavicka: "Dopad na dokumentaci", sirka: 52 },
    { hlavicka: "Odpovídá", sirka: 14 },
    { hlavicka: "Stav", sirka: 10 },
  ], 4);
  terminy.forEach((t, i) => {
    const n = 5 + i;
    tz.getCell(n, 1).value = t.datum;
    tz.getCell(n, 2).value = t.co;
    tz.getCell(n, 3).value = t.dopad;
    tz.getCell(n, 4).value = t.odpovida;
    tz.getCell(n, 5).value = t.stav;
  });
  ohraniceni(tz, 5, Math.max(4 + terminy.length, 5), 5);
  const poznamkaTz = Math.max(4 + terminy.length, 5) + 2;
  tz.mergeCells(`A${poznamkaTz}:E${poznamkaTz}`);
  const pt = tz.getCell(poznamkaTz, 1);
  pt.value =
    "Termíny se přenášejí i do smluv — u smlouvy o dílo je nutné určit, k jakému datu se posuzuje soulad díla s normami (k datu podpisu, nebo k datu předání). U přechodných období jde o přímý finanční dopad.";
  pt.font = { italic: true, color: { argb: INK_SOFT }, size: 10 };
  pt.alignment = { wrapText: true, vertical: "top" };
  tz.getRow(poznamkaTz).height = 30;

  return new Uint8Array((await wb.xlsx.writeBuffer()) as ArrayBuffer);
}

/** Jméno souboru pro rejstřík zakázek ve tvaru firemního souboru. */
export function nazevEvidenceSouboru(): string {
  const d = new Date();
  return `13_Evidence_zakazek_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}.xlsx`;
}

export function nazevNormySouboru(): string {
  const d = new Date();
  return `Rejstrik_pouzitych_norem_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}.xlsx`;
}