/**
 * Stavební prvky pro dokumenty, které se neskládají z hotové šablony, ale
 * generují se napevno (provozní, personální a metrologická agenda).
 *
 * Drží stejný vizuální jazyk jako zbytek aplikace: Calibri, cihlový akcent,
 * tenké linky, žádné rámované karty. Chybějící údaj zůstane zvýrazněný
 * žlutým placeholdrem a zapíše se do seznamu `nevyplneno` — stejně jako
 * u dokumentů ze šablon.
 */
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { Firma, Zakazka } from "../map";
import { predlozkaV, VYCHOZI_MOZNOSTI, type Doplnky, type Moznosti } from "./doplnky";
import { formatDate } from "../map";

export const BRICK = "B04A2F";
export const BRICK_DEEP = "7E3220";
export const INK = "2B2724";
export const INK_SOFT = "6E6A66";
export const LINE = "E3DCD5";
export const BRICK_WASH = "F7F1EC";
export const PAPER = "FFFFFF";

export const FONT = "Calibri";

export interface Kontext {
  zakazka: Zakazka;
  firma: Firma;
  /** Placeholdery, které se nepodařilo vyplnit — plní se průběžně. */
  nevyplneno: string[];
  /** Zvýraznit placeholdery žlutě (podle nastavení aplikace). */
  zvyraznit: boolean;
  /** Osoby, měřidla, oprávnění a provozní deník z agendy kanceláře. */
  doplnky: Doplnky;
}

export interface VysledekNoveho {
  data: Uint8Array;
  nevyplneno: string[];
}

// ------------------------------------------------------------------ běhy

/** Obyčejný běh textu. */
export function run(text: string, o: { bold?: boolean; size?: number; color?: string; italics?: boolean } = {}): TextRun {
  return new TextRun({ text, font: FONT, size: o.size ?? 21, color: o.color ?? INK, bold: o.bold, italics: o.italics });
}

/** Vyplněná hodnota, nebo zvýrazněný placeholder k doplnění. */
export function hv(
  ctx: Kontext,
  hodnota: string | undefined | null,
  placeholder: string,
  o: { bold?: boolean } = {},
): TextRun {
  const t = (hodnota ?? "").toString().trim();
  if (t) return run(t, { bold: o.bold });
  if (!ctx.nevyplneno.includes(placeholder)) ctx.nevyplneno.push(placeholder);
  return new TextRun({ text: placeholder, font: FONT, size: 21, color: INK, bold: o.bold, highlight: ctx.zvyraznit ? "yellow" : undefined });
}

/** Datum: ISO → české; chybí-li, zvýrazněný placeholder. */
export function hd(ctx: Kontext, hodnota: string | undefined | null, placeholder = "[DATUM]"): TextRun {
  return hv(ctx, formatDate((hodnota ?? "").toString()), placeholder);
}

/** Spojí neprázdné části; když nezbyde nic, vrátí prázdný řetězec. */
export function spoj(casti: (string | undefined | null)[], sep = ", "): string {
  return casti.map((c) => (c ?? "").toString().trim()).filter(Boolean).join(sep);
}

// -------------------------------------------------------------- odstavce

export function odstavec(
  obsah: TextRun | TextRun[] | string,
  o: { align?: (typeof AlignmentType)[keyof typeof AlignmentType]; spaceAfter?: number; spaceBefore?: number; indent?: number } = {},
): Paragraph {
  const children = typeof obsah === "string" ? [run(obsah)] : Array.isArray(obsah) ? obsah : [obsah];
  return new Paragraph({
    children,
    alignment: o.align,
    spacing: { after: o.spaceAfter ?? 120, before: o.spaceBefore ?? 0, line: 276 },
    indent: o.indent ? { left: o.indent } : undefined,
  });
}

/** Odstavec složený z popisků a hodnot — typický řádek „Popisek: hodnota“. */
export function radek(popisky: (TextRun | string)[], o: { spaceAfter?: number; indent?: number } = {}): Paragraph {
  return odstavec(
    popisky.map((p) => (typeof p === "string" ? run(p) : p)),
    { spaceAfter: o.spaceAfter ?? 80, indent: o.indent },
  );
}

/** Nadpis celého dokumentu — vycentrovaný, cihlový. */
export function nadpisDokumentu(text: string, podtitul?: string): Paragraph[] {
  const out = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: podtitul ? 60 : 240 },
      children: [new TextRun({ text: text.toUpperCase(), font: FONT, size: 28, bold: true, color: BRICK_DEEP })],
    }),
  ];
  if (podtitul) {
    out.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [new TextRun({ text: podtitul, font: FONT, size: 19, color: INK_SOFT })],
      }),
    );
  }
  return out;
}

/** Nadpis sekce — verzálky s prostrkáním, cihlový, s linkou pod sebou. */
export function nadpisSekce(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 260, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BRICK, space: 4 } },
    children: [
      new TextRun({ text: text.toUpperCase(), font: FONT, size: 19, bold: true, color: BRICK, characterSpacing: 20 }),
    ],
  });
}

/** Odrážka — používá se pro výčty úkonů a povinností. */
export function odrazka(obsah: TextRun | TextRun[] | string, uroven = 0): Paragraph {
  const children = typeof obsah === "string" ? [run(obsah)] : Array.isArray(obsah) ? obsah : [obsah];
  return new Paragraph({
    children: [run(uroven === 0 ? "• " : "– ", { color: INK_SOFT }), ...children],
    spacing: { after: 60, line: 264 },
    indent: { left: 360 + uroven * 300, hanging: 180 },
  });
}

/** Poznámkový blok s levým cihlovým pruhem. */
export function poznamka(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 140, after: 140, line: 264 },
    indent: { left: 200 },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: BRICK } },
    shading: { fill: BRICK_WASH },
    children: [run(text, { size: 19, color: INK_SOFT })],
  });
}

// ---------------------------------------------------------------- tabulky

export type Bunka = string | TextRun | TextRun[];

function bunky(obsah: Bunka, o: { sirka?: number; bold?: boolean; fill?: string; align?: "left" | "right" } = {}): TableCell {
  const children = typeof obsah === "string" ? [run(obsah, { bold: o.bold })] : Array.isArray(obsah) ? obsah : [obsah];
  return new TableCell({
    width: o.sirka ? { size: o.sirka, type: WidthType.PERCENTAGE } : undefined,
    shading: o.fill ? { fill: o.fill } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [
      new Paragraph({
        children,
        alignment: o.align === "right" ? AlignmentType.RIGHT : undefined,
        spacing: { after: 0, line: 252 },
      }),
    ],
  });
}

/** Tabulka dvojic popisek / hodnota — základ pro identifikační bloky. */
export function tabulkaDvojic(
  radky: { popisek: string; hodnota: Bunka }[],
  o: { levySloupec?: number } = {},
): Table {
  const levy = o.levySloupec ?? 32;
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: LINE },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: LINE },
      left: { style: BorderStyle.SINGLE, size: 2, color: LINE },
      right: { style: BorderStyle.SINGLE, size: 2, color: LINE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: LINE },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: LINE },
    },
    rows: radky.map(
      (r) =>
        new TableRow({
          cantSplit: true,
          children: [
            bunky(r.popisek, { sirka: levy, fill: BRICK_WASH }),
            bunky(r.hodnota, { sirka: 100 - levy }),
          ],
        }),
    ),
  });
}

/** Obecná tabulka se záhlavím. */
export function tabulka(
  zahlavi: string[],
  radky: Bunka[][],
  o: { sirky?: number[] } = {},
): Table {
  const sirky = o.sirky ?? zahlavi.map(() => Math.round(100 / zahlavi.length));
  const makeRow = (obsah: Bunka[], head: boolean) =>
    new TableRow({
      tableHeader: head,
      cantSplit: true,
      children: obsah.map((b, i) =>
        bunky(b, { sirka: sirky[i], bold: head, fill: head ? BRICK_WASH : undefined }),
      ),
    });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: LINE },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: LINE },
      left: { style: BorderStyle.SINGLE, size: 2, color: LINE },
      right: { style: BorderStyle.SINGLE, size: 2, color: LINE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: LINE },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: LINE },
    },
    rows: [makeRow(zahlavi, true), ...radky.map((r) => makeRow(r, false))],
  });
}

// ------------------------------------------------------------- identifikace

/** Hlavička dokumentu z údajů firmy. */
export function zahlaviFirmy(f: Firma): Paragraph[] {
  const radek1 = spoj([f.nazev]) || "[NÁZEV FIRMY]";
  const radek2 = spoj([f.adresa, f.ico ? `IČO ${f.ico}` : "", f.dic ? `DIČ ${f.dic}` : ""]);
  const radek3 = spoj([f.telefon, f.email, f.web]);
  const out = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [new TextRun({ text: radek1, font: FONT, size: 22, bold: true, color: INK })],
    }),
  ];
  if (radek2) {
    out.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 20 },
        children: [new TextRun({ text: radek2, font: FONT, size: 18, color: INK_SOFT })],
      }),
    );
  }
  if (radek3) {
    out.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 20 },
        children: [new TextRun({ text: radek3, font: FONT, size: 18, color: INK_SOFT })],
      }),
    );
  }
  out.push(
    new Paragraph({
      spacing: { before: 80, after: 240 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: BRICK, space: 2 } },
      children: [new TextRun({ text: "", font: FONT, size: 8 })],
    }),
  );
  return out;
}

/** Identifikace stavby a zakázky — stejný blok používá většina dokumentů. */
export function identifikaceStavby(ctx: Kontext, o: { sCislemDokumentu?: string } = {}): Table {
  const z = ctx.zakazka;
  const radky: { popisek: string; hodnota: Bunka }[] = [];
  if (o.sCislemDokumentu) radky.push({ popisek: "Číslo dokumentu", hodnota: hv(ctx, o.sCislemDokumentu, "[ČÍSLO DOKUMENTU]") });
  radky.push({ popisek: "Číslo zakázky", hodnota: hv(ctx, z.cislo, "[ČÍSLO ZAKÁZKY]") });
  radky.push({ popisek: "Název stavby", hodnota: hv(ctx, z.nazevStavby, "[NÁZEV STAVBY]") });
  if ((z.nazevObjektu ?? "").trim()) radky.push({ popisek: "Objekt", hodnota: run(z.nazevObjektu) });
  radky.push({
    popisek: "Místo stavby",
    hodnota: hv(ctx, spoj([z.adresaStavby, z.parcela, z.katastr]), "[ADRESA, PARCELA, KATASTRÁLNÍ ÚZEMÍ]"),
  });
  radky.push({
    popisek: "Provozovatel / vlastník",
    hodnota: hv(ctx, spoj([z.investor, z.investorAdresa, z.investorIco ? `IČO ${z.investorIco}` : ""]), "[PROVOZOVATEL, SÍDLO, IČO]"),
  });
  if ((z.distributor ?? "").trim()) radky.push({ popisek: "Distributor", hodnota: run(z.distributor) });
  radky.push({
    popisek: "Elektrické zařízení",
    hodnota: hv(ctx, spoj([z.profese, z.soustava, z.jistic ? `hlavní jistič ${z.jistic}` : ""]), "[DRUH A ROZSAH ELEKTRICKÉHO ZAŘÍZENÍ]"),
  });
  return tabulkaDvojic(radky);
}

/** Podpisový blok: role, jméno, datum, podpisová linka. */
export function podpisy(
  ctx: Kontext,
  sloupce: { role: string; jmeno?: string; placeholder?: string }[],
): Table {
  const bunkySloupcu = sloupce.map(
    (s) =>
      new TableCell({
        width: { size: Math.round(100 / sloupce.length), type: WidthType.PERCENTAGE },
        margins: { top: 120, bottom: 60, left: 60, right: 200 },
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: PAPER },
          bottom: { style: BorderStyle.NONE, size: 0, color: PAPER },
          left: { style: BorderStyle.NONE, size: 0, color: PAPER },
          right: { style: BorderStyle.NONE, size: 0, color: PAPER },
        },
        children: [
          new Paragraph({
            spacing: { before: 500, after: 40 },
            border: { top: { style: BorderStyle.SINGLE, size: 6, color: INK_SOFT, space: 2 } },
            children: [run(s.role, { size: 17, color: INK_SOFT })],
          }),
          new Paragraph({
            spacing: { after: 0 },
            children: [hv(ctx, s.jmeno, s.placeholder ?? "[JMÉNO A PŘÍJMENÍ]")],
          }),
        ],
      }),
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: PAPER },
      bottom: { style: BorderStyle.NONE, size: 0, color: PAPER },
      left: { style: BorderStyle.NONE, size: 0, color: PAPER },
      right: { style: BorderStyle.NONE, size: 0, color: PAPER },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: PAPER },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: PAPER },
    },
    rows: [new TableRow({ children: bunkySloupcu })],
  });
}

/** Řádek místo a datum — používá se nad podpisy. */
export function mistoDatum(ctx: Kontext, misto?: string): Paragraph {
  return new Paragraph({
    spacing: { before: 320, after: 0 },
    children: [
      run(`${predlozkaV(misto ?? ctx.zakazka.mistoPodpisu ?? "")} `),
      hv(ctx, misto ?? ctx.zakazka.mistoPodpisu, "[MÍSTO]"),
      run(" dne "),
      hv(ctx, formatDate(ctx.zakazka.datum), "[DATUM]"),
    ],
  });
}

/** Patička s identifikací dokumentu a číslem strany. */
export function paticka(ctx: Kontext, oznaceni: string): Footer {
  const vlevo = spoj([ctx.firma.nazev, ctx.zakazka.cislo ? `zakázka ${ctx.zakazka.cislo}` : ""]) || "LOSKOT HOZÁKOVÁ";
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 4 } },
        children: [
          new TextRun({ text: `${oznaceni} · ${vlevo}`, font: FONT, size: 15, color: INK_SOFT }),
        ],
      }),
    ],
  });
}

// ------------------------------------------------------------------ výstup

/** Složí dokument ze sekcí a vrátí DOCX jako bajty. */
export async function sestavDocx(
  ctx: Kontext,
  oznaceni: string,
  deti: (Paragraph | Table)[],
): Promise<VysledekNoveho> {
  const doc = new Document({
    creator: ctx.firma.nazev || "LOSKOT HOZÁKOVÁ",
    title: oznaceni,
    description: spoj([oznaceni, ctx.zakazka.cislo, ctx.zakazka.nazevStavby]),
    styles: {
      default: {
        document: { run: { font: FONT, size: 21, color: INK } },
      },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } },
        },
        footers: { default: paticka(ctx, oznaceni) },
        children: deti,
      },
    ],
  });
  const buffer = await Packer.toBuffer(doc);
  return { data: new Uint8Array(buffer), nevyplneno: ctx.nevyplneno };
}

/** Založí kontext pro nový dokument. */
export function kontext(zakazka: Zakazka, firma: Firma, o: Moznosti = VYCHOZI_MOZNOSTI): Kontext {
  return { zakazka, firma, nevyplneno: [], zvyraznit: o.zvyraznit, doplnky: o.doplnky };
}