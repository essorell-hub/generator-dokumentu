/**
 * Export provozní agendy do XLSX — osoby, měřidla, oprávnění, provozní deník.
 * Lhůty jsou vzorce (EDATE, TODAY), aby se sešit přepočítával i v Excelu.
 */
import ExcelJS from "exceljs";
import { datum, ohraniceni, seznam, zahlavi } from "./agenda/xlsx";
import { STUPNE } from "./docgen/nove/doplnky";
import { db } from "../database";
import { zakazky } from "../database/schema";
import { seznamMeridel, seznamOpravneni, seznamOsob, seznamProhlidek } from "./provoz";

const DATUM = "dd.mm.yyyy";

function podminene(ws: ExcelJS.Worksheet, rozsah: string) {
  ws.addConditionalFormatting({
    ref: rozsah,
    rules: [
      {
        type: "cellIs",
        operator: "lessThan",
        formulae: ["0"],
        priority: 1,
        style: { font: { color: { argb: "FFB04A2F" }, bold: true }, fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFF7E1DA" } } },
      },
      {
        type: "cellIs",
        operator: "between",
        formulae: ["0", "60"],
        priority: 2,
        style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFFFF2CC" } } },
      },
    ],
  });
}

export async function provozXlsx(): Promise<Uint8Array> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Generátor dokumentů — LOSKOT HOZÁKOVÁ";
  wb.created = new Date();

  // ------------------------------------------------------------- Osoby
  const os = await seznamOsob();
  const wo = wb.addWorksheet("Osoby");
  zahlavi(wo, [
    { hlavicka: "Jméno a příjmení", sirka: 24 },
    { hlavicka: "Funkce", sirka: 18 },
    { hlavicka: "Stupeň (NV 194/2022)", sirka: 20 },
    { hlavicka: "Rozsah", sirka: 9 },
    { hlavicka: "Číslo dokladu / osvědčení", sirka: 20 },
    { hlavicka: "Doklad platný do", sirka: 13 },
    { hlavicka: "Zbývá dní", sirka: 9 },
    { hlavicka: "Poslední školení", sirka: 13 },
    { hlavicka: "Příští školení", sirka: 13 },
    { hlavicka: "Zbývá dní", sirka: 9 },
    { hlavicka: "Příští zdravotní prohlídka", sirka: 14 },
    { hlavicka: "Zbývá dní", sirka: 9 },
    { hlavicka: "Aktivní", sirka: 8 },
    { hlavicka: "Poznámka", sirka: 28 },
  ], 1);
  wo.views = [{ state: "frozen", xSplit: 1, ySplit: 1 }];
  const radkuOsob = Math.max(os.length, 1) + 40;
  for (let i = 0; i < radkuOsob; i++) {
    const n = i + 2;
    const r = os[i];
    const row = wo.getRow(n);
    row.values = [
      r?.jmeno ?? "",
      r?.funkce ?? "",
      r?.stupen ?? "",
      r?.rozsah ?? "",
      r?.cisloDokladu ?? "",
      r ? datum(r.dokladPlatnostDo) : null,
      { formula: `IF(F${n}="","",F${n}-TODAY())` },
      r ? datum(r.skoleniPosledni) : null,
      { formula: `IF(H${n}="","",EDATE(H${n},12))` },
      { formula: `IF(I${n}="","",I${n}-TODAY())` },
      r ? datum(r.zdravotniPristi) : null,
      { formula: `IF(K${n}="","",K${n}-TODAY())` },
      r ? (r.aktivni ? "ano" : "ne") : "",
      r?.poznamka ?? "",
    ] as ExcelJS.CellValue[];
    for (const c of [6, 8, 9, 11]) row.getCell(c).numFmt = DATUM;
  }
  ohraniceni(wo, 2, radkuOsob + 1, 14);
  seznam(wo, `C2:C${radkuOsob + 1}`, STUPNE);
  seznam(wo, `M2:M${radkuOsob + 1}`, ["ano", "ne"]);
  for (const s of ["G", "J", "L"]) podminene(wo, `${s}2:${s}${radkuOsob + 1}`);

  // ----------------------------------------------------------- Měřidla
  const me = await seznamMeridel();
  const wm = wb.addWorksheet("Měřidla");
  zahlavi(wm, [
    { hlavicka: "Přístroj", sirka: 26 },
    { hlavicka: "Výrobce", sirka: 14 },
    { hlavicka: "Typ", sirka: 14 },
    { hlavicka: "Výrobní číslo", sirka: 16 },
    { hlavicka: "Kalibrační list", sirka: 18 },
    { hlavicka: "Datum kalibrace", sirka: 13 },
    { hlavicka: "Interval (měsíce)", sirka: 10 },
    { hlavicka: "Kalibrace platná do", sirka: 13 },
    { hlavicka: "Zbývá dní", sirka: 9 },
    { hlavicka: "Kalibroval", sirka: 20 },
    { hlavicka: "Aktivní", sirka: 8 },
    { hlavicka: "Poznámka", sirka: 26 },
  ], 1);
  wm.views = [{ state: "frozen", xSplit: 1, ySplit: 1 }];
  const radkuMeridel = Math.max(me.length, 1) + 30;
  for (let i = 0; i < radkuMeridel; i++) {
    const n = i + 2;
    const r = me[i];
    const row = wm.getRow(n);
    row.values = [
      r?.nazev ?? "",
      r?.vyrobce ?? "",
      r?.typ ?? "",
      r?.vyrobniCislo ?? "",
      r?.kalibracniList ?? "",
      r ? datum(r.kalibraceDatum) : null,
      r ? r.intervalMesicu : null,
      { formula: `IF(F${n}="","",EDATE(F${n},IF(G${n}="",12,G${n})))` },
      { formula: `IF(H${n}="","",H${n}-TODAY())` },
      r?.kalibroval ?? "",
      r ? (r.aktivni ? "ano" : "ne") : "",
      r?.poznamka ?? "",
    ] as ExcelJS.CellValue[];
    for (const c of [6, 8]) row.getCell(c).numFmt = DATUM;
  }
  ohraniceni(wm, 2, radkuMeridel + 1, 12);
  seznam(wm, `K2:K${radkuMeridel + 1}`, ["ano", "ne"]);
  podminene(wm, `I2:I${radkuMeridel + 1}`);

  // --------------------------------------------------------- Oprávnění
  const op = await seznamOpravneni();
  const wp = wb.addWorksheet("Oprávnění");
  zahlavi(wp, [
    { hlavicka: "Druh", sirka: 40 },
    { hlavicka: "Číslo", sirka: 18 },
    { hlavicka: "Rozsah", sirka: 30 },
    { hlavicka: "Vydal", sirka: 18 },
    { hlavicka: "Platné od", sirka: 13 },
    { hlavicka: "Platné do", sirka: 13 },
    { hlavicka: "Zbývá dní", sirka: 9 },
    { hlavicka: "Poznámka", sirka: 26 },
  ], 1);
  const radkuOpr = Math.max(op.length, 1) + 15;
  for (let i = 0; i < radkuOpr; i++) {
    const n = i + 2;
    const r = op[i];
    const row = wp.getRow(n);
    row.values = [
      r?.druh ?? "",
      r?.cislo ?? "",
      r?.rozsah ?? "",
      r?.vydal ?? "",
      r ? datum(r.platnostOd) : null,
      r ? datum(r.platnostDo) : null,
      { formula: `IF(F${n}="","",F${n}-TODAY())` },
      r?.poznamka ?? "",
    ] as ExcelJS.CellValue[];
    for (const c of [5, 6]) row.getCell(c).numFmt = DATUM;
  }
  ohraniceni(wp, 2, radkuOpr + 1, 8);
  podminene(wp, `G2:G${radkuOpr + 1}`);

  // --------------------------------------------------- Provozní deník
  const [pr, zk] = await Promise.all([seznamProhlidek(), db.select({ id: zakazky.id, cislo: zakazky.cislo }).from(zakazky)]);
  const cislaZakazek = new Map(zk.map((z) => [z.id, z.cislo]));
  const wd = wb.addWorksheet("Provozní deník");
  zahlavi(wd, [
    { hlavicka: "Datum", sirka: 12 },
    { hlavicka: "Zakázka", sirka: 12 },
    { hlavicka: "Druh úkonu", sirka: 16 },
    { hlavicka: "Rozsah", sirka: 28 },
    { hlavicka: "Výsledek", sirka: 28 },
    { hlavicka: "Závada", sirka: 26 },
    { hlavicka: "Odstraněno", sirka: 20 },
    { hlavicka: "Provedl", sirka: 18 },
  ], 1);
  wd.views = [{ state: "frozen", ySplit: 1 }];
  const radkuDeniku = Math.max(pr.length, 1) + 60;
  for (let i = 0; i < radkuDeniku; i++) {
    const r = pr[i];
    const row = wd.getRow(i + 2);
    row.values = [
      r ? datum(r.datum) : null,
      r?.zakazkaId ? (cislaZakazek.get(r.zakazkaId) ?? "") : "",
      r?.druh ?? "",
      r?.rozsah ?? "",
      r?.vysledek ?? "",
      r?.zavada ?? "",
      r?.odstraneno ?? "",
      r?.provedl ?? "",
    ] as ExcelJS.CellValue[];
    row.getCell(1).numFmt = DATUM;
  }
  ohraniceni(wd, 2, radkuDeniku + 1, 8);
  seznam(wd, `C2:C${radkuDeniku + 1}`, ["Prohlídka", "Zkouška", "Údržba", "Oprava", "Revize", "Mimořádná událost"]);

  return new Uint8Array((await wb.xlsx.writeBuffer()) as ArrayBuffer);
}

export function nazevProvozSouboru(): string {
  const d = new Date();
  return `Provozni_agenda_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}.xlsx`;
}
