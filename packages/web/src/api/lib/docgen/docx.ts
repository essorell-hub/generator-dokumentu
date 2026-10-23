/**
 * Engine pro plnění DOCX šablon.
 *
 * Šablony jsou schválené soubory `rev-01` až `rev-03-2026` vložené jako base64. Engine
 * rozbalí DOCX, v `word/document.xml` (a v patičkách) přepíše textové
 * placeholdery za hodnoty zakázky, nevyplněná místa zvýrazní a soubor zabalí
 * zpět. Formátování šablony zůstává nedotčené — mění se jen obsah `<w:t>`.
 */
import { unzipSync, zipSync } from "fflate";

export interface Rule {
  /** Přesný text, jak je v šabloně — může nést i okolní kontext pro rozlišení. */
  match: string;
  /** Nahrazující hodnota, nebo `null` pro ponechání beze změny. */
  value: string | null;
  /** Nahradit jen n-tý výskyt v odstavci (0 = první). Bez hodnoty se nahradí všechny. */
  index?: number;
  /**
   * Nahradit jen n-tý výskyt v celém dokumentu (0 = první) — pro rozlišení dvou
   * shodných bloků.
   */
  occurrence?: number;
  /**
   * Místo se považuje za vyřešené, ale text zůstane — `value` se použije, jen
   * když je vyplněné. Používá se tam, kde v šabloně stojí datum nebo číslo
   * s jiným významem, než má datum zakázky (lhůta plnění, kalibrace přístroje,
   * datum uvedení do provozu), aby do něj obecné pravidlo nepropsalo omylem
   * datum zpracování.
   */
  preserve?: boolean;
}

export interface DocxOptions {
  rules: Rule[];
  /** Zvýraznit zbylá nevyplněná místa žlutě. */
  highlight?: boolean;
  /** Metadata dokumentu. */
  meta?: { title?: string; creator?: string };
}

export interface DocxOutcome {
  data: Uint8Array;
  /** Nevyplněná místa, která v dokumentu zůstala (vnější závorky, bez duplicit). */
  unresolved: string[];
}

// --------------------------------------------------------------- XML pomoc

export function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, "&");
}

export function encodeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Pořadí potomků `w:rPr` podle ECMA-376 — `w:highlight` patří mezi `w:szCs` a `w:u`. */
const AFTER_HIGHLIGHT = new Set([
  "u",
  "effect",
  "bdr",
  "shd",
  "fitText",
  "vertAlign",
  "rtl",
  "cs",
  "em",
  "lang",
  "eastAsianLayout",
  "specVanish",
  "oMath",
]);

const HIGHLIGHT = '<w:highlight w:val="yellow"/>';

function withHighlight(runXml: string): string {
  const openEnd = runXml.indexOf(">") + 1;
  if (openEnd <= 0) return runXml;
  const open = runXml.slice(0, openEnd);
  const rest = runXml.slice(openEnd);

  const rprMatch = /^<w:rPr(?:\s[^>]*)?>([\s\S]*?)<\/w:rPr>/.exec(rest);
  if (!rprMatch) return `${open}<w:rPr>${HIGHLIGHT}</w:rPr>${rest}`;

  const inner = rprMatch[1];
  if (inner.includes("<w:highlight")) return runXml;

  const childRe = /<(w:[A-Za-z]+)(?:\s[^>]*?)?\/?>/g;
  let insertAt = inner.length;
  let m: RegExpExecArray | null;
  while ((m = childRe.exec(inner))) {
    if (AFTER_HIGHLIGHT.has(m[1])) {
      insertAt = m.index;
      break;
    }
  }
  const patched = inner.slice(0, insertAt) + HIGHLIGHT + inner.slice(insertAt);
  return `${open}<w:rPr>${patched}</w:rPr>${rest.slice(rprMatch[0].length)}`;
}

/** Vnější závorkové bloky v textu — vnořené se přeskočí. */
export function scanTokens(text: string): { start: number; end: number; inner: string }[] {
  const out: { start: number; end: number; inner: string }[] = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== "[") continue;
    let depth = 0;
    for (let j = i; j < text.length; j++) {
      const ch = text[j];
      if (ch === "[") depth++;
      else if (ch === "]") {
        depth--;
        if (depth === 0) {
          out.push({ start: i, end: j + 1, inner: text.slice(i + 1, j) });
          i = j;
          break;
        }
      }
    }
  }
  return out;
}

// ------------------------------------------------------------ zpracování

interface Seg {
  /** Offset obsahu `<w:t>` v bloku odstavce. */
  contentStart: number;
  contentEnd: number;
  /** Offset otevírací značky `<w:t …>`. */
  tagStart: number;
  /** Offset v dekódovaném textu odstavce. */
  start: number;
  end: number;
  text: string;
}

const PARA_RE = /<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g;
const TEXT_RE = /<w:t(\s[^>]*?)?>([\s\S]*?)<\/w:t>/g;
const RUN_RE = /<w:r(?:\s[^>]*)?>/g;

function segmentsOf(block: string): Seg[] {
  const segs: Seg[] = [];
  let offset = 0;
  TEXT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TEXT_RE.exec(block))) {
    const raw = m[2];
    const text = decodeXml(raw);
    const contentStart = m.index + m[0].indexOf(">", m[0].indexOf("<w:t")) + 1;
    segs.push({
      tagStart: m.index,
      contentStart,
      contentEnd: contentStart + raw.length,
      start: offset,
      end: offset + text.length,
      text,
    });
    offset += text.length;
  }
  return segs;
}

interface Edit {
  start: number;
  end: number;
  replacement: string;
}

function collectEdits(text: string, rules: Rule[], counters: Map<Rule, number>): Edit[] {
  const edits: Edit[] = [];
  const claimed: [number, number][] = [];
  const overlaps = (s: number, e: number) => claimed.some(([a, b]) => s < b && e > a);

  for (const rule of rules) {
    const needle = rule.match;
    if (!needle) continue;
    // U pravidel s `occurrence` se pořadí musí posouvat i tehdy, když hodnotu
    // nemáme — jinak by druhá shodná klauzule v dokumentu nikdy nedostala svou.
    const hodnota = rule.value;
    const zanechat = rule.preserve === true;
    const skip = !zanechat && (hodnota === null || hodnota === undefined);
    let from = 0;
    let seen = 0;
    for (;;) {
      const at = text.indexOf(needle, from);
      if (at === -1) break;
      from = at + needle.length;

      const ordinal = counters.get(rule) ?? 0;
      counters.set(rule, ordinal + 1);

      if (skip) continue;
      if (rule.occurrence !== undefined && ordinal !== rule.occurrence) continue;
      if (rule.occurrence === undefined && rule.index !== undefined && seen++ !== rule.index) continue;
      if (overlaps(at, at + needle.length)) continue;

      claimed.push([at, at + needle.length]);
      edits.push({
        start: at,
        end: at + needle.length,
        replacement: hodnota ? hodnota : needle,
      });
      if (rule.occurrence !== undefined || rule.index !== undefined) break;
    }
  }
  return edits.sort((a, b) => a.start - b.start);
}

function applyEdits(block: string, segs: Seg[], edits: Edit[]): string {
  if (!edits.length) return block;
  let out = block;
  for (let i = segs.length - 1; i >= 0; i--) {
    const seg = segs[i];
    let cursor = 0;
    let text = "";
    for (const ed of edits) {
      if (ed.end <= seg.start || ed.start >= seg.end) continue;
      const localStart = Math.max(ed.start, seg.start) - seg.start;
      const localEnd = Math.min(ed.end, seg.end) - seg.start;
      text += seg.text.slice(cursor, localStart);
      if (ed.start >= seg.start && ed.start < seg.end) text += ed.replacement;
      cursor = localEnd;
    }
    text += seg.text.slice(cursor);
    const encoded = encodeXml(text);
    const tag = block.slice(seg.tagStart, seg.contentStart);
    const openTag = /\sxml:space="preserve"/.test(tag)
      ? tag
      : tag.replace(/^<w:t/, '<w:t xml:space="preserve"');
    out = out.slice(0, seg.tagStart) + openTag + encoded + out.slice(seg.contentEnd);
  }
  return out;
}

const ALL_RUNS_RE = /<w:r(?:\s[^>]*)?\/>|<w:r(?:\s[^>]*)?>[\s\S]*?<\/w:r>/g;

interface SimpleRun {
  xml: string;
  /** Obsah `<w:rPr>`, nebo `null`. */
  rPr: string | null;
  /** Otevírací značka běhu s atributy. */
  open: string;
  /** Běh bez textu (např. `<w:r/>`). */
  empty: boolean;
}

/**
 * Rozpadne odstavec na jednotlivé běhy, pokud v něm nic jiného než `w:rPr`
 * a `w:t` není. Slouží k tomu, aby šlo zvýraznit jen samotné nevyplněné místo
 * a ne celý odstavec, ve kterém stojí.
 */
function simpleRuns(block: string, segs: Seg[]): SimpleRun[] | null {
  const bodyStart = block.indexOf(">") + 1;
  const pPr = /^<w:pPr(?:\s[^>]*)?>[\s\S]*?<\/w:pPr>/.exec(block.slice(bodyStart));
  const start = pPr ? bodyStart + pPr[0].length : bodyStart;
  const body = block.slice(start, block.lastIndexOf("</w:p>"));
  if (body.trim() === "") return null;

  ALL_RUNS_RE.lastIndex = 0;
  const runs: SimpleRun[] = [];
  let cursor = 0;
  let covered = 0;
  let m: RegExpExecArray | null;
  while ((m = ALL_RUNS_RE.exec(body))) {
    if (m.index !== cursor) return null; // mezi běhy je něco jiného
    cursor = m.index + m[0].length;
    covered++;
    const run = m[0];
    if (run.endsWith("/>")) {
      runs.push({ xml: run, rPr: null, open: run, empty: true });
      continue;
    }
    const open = run.slice(0, run.indexOf(">") + 1);
    let inner = run.slice(open.length, -"</w:r>".length);
    let rPr: string | null = null;
    const r = /^<w:rPr(?:\s[^>]*)?>[\s\S]*?<\/w:rPr>/.exec(inner);
    if (r) {
      rPr = r[0];
      inner = inner.slice(r[0].length);
    }
    // jediné, co smí zůstat, je právě jeden text
    if (!/^<w:t(?:\s[^>]*)?>[\s\S]*?<\/w:t>$/.test(inner)) {
      if (inner.trim() === "") {
        runs.push({ xml: run, rPr, open, empty: true });
        continue;
      }
      return null;
    }
    runs.push({ xml: run, rPr, open, empty: false });
  }
  if (covered === 0 || body.slice(cursor).trim() !== "") return null;
  // každý neprázdný běh musí odpovídat právě jednomu textovému úseku
  const sTexty = runs.filter((r) => !r.empty).length;
  if (sTexty !== segs.length) return null;
  return runs;
}

/** Zvýrazní jen nevyplněná místa — text před nimi a za nimi nechá bez barvy. */
function highlightTokens(block: string): string | null {
  const segs = segmentsOf(block);
  if (!segs.length) return null;
  const text = segs.map((s) => s.text).join("");
  const tokens = scanTokens(text).filter((t) => t.inner.trim() !== "");
  if (!tokens.length) return null;

  const runs = simpleRuns(block, segs);
  if (!runs) return null;

  // hranice: text se rozpadne na úseky uvnitř a vně nevyplněných míst
  const hranice: { start: number; end: number; token: boolean }[] = [];
  for (const t of tokens) {
    hranice.push({ start: t.start, end: t.end, token: true });
  }
  hranice.sort((a, b) => a.start - b.start);

  const pieces: { start: number; end: number; token: boolean }[] = [];
  let cursor = 0;
  for (const h of hranice) {
    if (h.start > cursor) pieces.push({ start: cursor, end: h.start, token: false });
    pieces.push(h);
    cursor = h.end;
  }
  if (cursor < text.length) pieces.push({ start: cursor, end: text.length, token: false });

  // rozsahy textových běhů v souřadnicích odstavce
  const rozsahy = segs.map((s) => ({ start: s.start, end: s.end }));

  const bodyStart = block.indexOf(">") + 1;
  const pPr = /^<w:pPr(?:\s[^>]*)?>[\s\S]*?<\/w:pPr>/.exec(block.slice(bodyStart));
  const innerStart = pPr ? bodyStart + pPr[0].length : bodyStart;
  const innerEnd = block.lastIndexOf("</w:p>");

  const textove = runs.filter((r) => !r.empty);
  let out = pPr ? block.slice(bodyStart, innerStart) : "";
  out += runs.filter((r) => r.empty).map((r) => r.xml).join("");
  for (let i = 0; i < rozsahy.length; i++) {
    const rozsah = rozsahy[i];
    const vzor = textove[i];
    if (!vzor) continue;
    for (const piece of pieces) {
      const start = Math.max(piece.start, rozsah.start);
      const end = Math.min(piece.end, rozsah.end);
      if (start >= end) continue;
      const obsah = encodeXml(text.slice(start, end));
      out += piece.token
        ? withHighlight(vzor.open + `${vzor.rPr ?? ""}</w:r>`).replace(
            "</w:r>",
            `<w:t xml:space="preserve">${obsah}</w:t></w:r>`,
          )
        : `${vzor.open}${vzor.rPr ?? ""}<w:t xml:space="preserve">${obsah}</w:t></w:r>`;
    }
  }
  return block.slice(0, innerStart) + out + block.slice(innerEnd);
}

function highlightRemaining(block: string): string {
  const segs = segmentsOf(block);
  if (!segs.length) return block;
  const text = segs.map((s) => s.text).join("");
  if (!text.includes("[")) return block;

  const tokens = scanTokens(text).filter((t) => t.inner.trim() !== "");
  if (!tokens.length) return block;

  const jemne = highlightTokens(block);
  if (jemne !== null) return jemne;

  const runs = new Set<number>();
  for (const token of tokens) {
    for (const seg of segs) {
      if (seg.end <= token.start || seg.start >= token.end) continue;
      RUN_RE.lastIndex = 0;
      let m: RegExpExecArray | null;
      let owner = -1;
      while ((m = RUN_RE.exec(block))) {
        if (m.index >= seg.tagStart) break;
        owner = m.index;
      }
      // značka musí skutečně ležet uvnitř běhu
      if (owner >= 0 && block.lastIndexOf("</w:r>", seg.tagStart) < owner) runs.add(owner);
    }
  }
  if (!runs.size) return block;

  let out = block;
  for (const at of [...runs].sort((a, b) => b - a)) {
    const openEnd = out.indexOf(">", at) + 1;
    let end = out.length;
    for (let i = openEnd; i < out.length; i++) {
      if (out.startsWith("</w:r>", i)) {
        end = i;
        break;
      }
    }
    out = out.slice(0, at) + withHighlight(out.slice(at, end)) + out.slice(end);
  }
  return out;
}

/**
 * Word i LibreOffice umí prázdný odstavec na konci dokumentu přesunout na
 * samostatnou stránku, jakmile obsah o pár řádků povyroste. Prázdné odstavce
 * na konci těla proto vypustíme — v hotovém dokumentu nic neznamenají a jinak
 * dělají prázdnou poslední stránku, jakmile se vyplní místa delším textem.
 */
function bezPrazdnychNaKonci(xml: string): string {
  const re =
    /(?:\s*<w:p\b[^>]*>(?:(?!<w:t[\s>])[\s\S])*?<\/w:p>|\s*<w:p\b[^>]*\/>)+(?=\s*<w:sectPr)/g;
  return xml.replace(re, (blok) =>
    /<w:t[\s>]|<w:br|<w:drawing|<w:pict/.test(blok) ? blok : "",
  );
}

function processXml(xml: string, rules: Rule[], highlight: boolean): { xml: string; unresolved: string[] } {
  const unresolved = new Set<string>();
  const counters = new Map<Rule, number>();
  const out = xml.replace(PARA_RE, (block) => {
    if (!block.includes("[")) return block;
    const segs = segmentsOf(block);
    const text = segs.map((s) => s.text).join("");
    if (!text.includes("[")) return block;

    const edits = collectEdits(text, rules, counters);
    let next = edits.length ? applyEdits(block, segs, edits) : block;

    if (highlight) {
      next = highlightRemaining(next);
    }

    const finalSegs = segmentsOf(next);
    const finalText = finalSegs.map((s) => s.text).join("");
    // prázdná buňka v tabulce se zvýrazní (uživatel vidí, že ji má vyplnit),
    // ale do seznamu míst k doplnění patří jen jednou a jen tam, kde odstavec
    // neobsahuje nic jiného smysluplného
    const zbyle = scanTokens(finalText);
    const pojmenovane = zbyle.filter((t) => t.inner.trim() !== "");
    if (pojmenovane.length) {
      for (const token of pojmenovane) unresolved.add(token.inner.trim());
    } else if (zbyle.length) {
      unresolved.add("[ ]");
    }
    return next;
  });
  return { xml: out, unresolved: [...unresolved] };
}

// -------------------------------------------------------------- veřejné API

export function fillDocx(template: Uint8Array, options: DocxOptions): DocxOutcome {
  const files = unzipSync(template);
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const unresolved = new Set<string>();

  const isXml = (name: string) =>
    name === "word/document.xml" ||
    /^word\/(header|footer)\d*\.xml$/.test(name) ||
    name === "docProps/core.xml";

  const out: Record<string, Uint8Array> = {};

  for (const [name, bytes] of Object.entries(files)) {
    if (!isXml(name)) {
      out[name] = bytes;
      continue;
    }
    let xml = decoder.decode(bytes);

    if (name === "docProps/core.xml") {
      if (options.meta?.title) {
        xml = xml.replace(
          /(<dc:title>)[\s\S]*?(<\/dc:title>)/,
          `$1${encodeXml(options.meta.title)}$2`,
        );
      }
      if (options.meta?.creator) {
        xml = xml.replace(
          /(<dc:creator>)[\s\S]*?(<\/dc:creator>)/,
          `$1${encodeXml(options.meta.creator)}$2`,
        );
      }
      out[name] = encoder.encode(xml);
      continue;
    }

    const result = processXml(xml, options.rules, options.highlight !== false);
    for (const item of result.unresolved) unresolved.add(item);
    out[name] = encoder.encode(
      name === "word/document.xml" ? bezPrazdnychNaKonci(result.xml) : result.xml,
    );
  }

  const zipped = zipSync(out, { level: 6 });
  return { data: zipped, unresolved: [...unresolved] };
}
