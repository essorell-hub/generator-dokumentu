/**
 * Údaje z provozní agendy kanceláře, které nové dokumenty potřebují
 * (osoby a jejich způsobilost, měřidla, oprávnění firmy, provozní deník).
 * Čisté typy a výpočty — bez přístupu k databázi.
 */

export interface OsobaDoc {
  jmeno: string;
  funkce: string;
  stupen: string;
  rozsah: string;
  cisloDokladu: string;
  dokladPlatnostDo: string;
  skoleniPosledni: string;
  zdravotniPristi: string;
  datumNarozeni: string;
  aktivni: boolean;
}

export interface MeridloDoc {
  nazev: string;
  vyrobce: string;
  typ: string;
  vyrobniCislo: string;
  kalibracniList: string;
  kalibraceDatum: string;
  intervalMesicu: number;
  aktivni: boolean;
}

export interface OpravneniDoc {
  druh: string;
  cislo: string;
  rozsah: string;
  vydal: string;
  platnostDo: string;
}

export interface ProhlidkaDoc {
  datum: string;
  druh: string;
  rozsah: string;
  provedl: string;
  vysledek: string;
  zavada: string;
  odstraneno: string;
}

export interface Doplnky {
  osoby: OsobaDoc[];
  meridla: MeridloDoc[];
  opravneni: OpravneniDoc[];
  prohlidky: ProhlidkaDoc[];
}

export interface Moznosti {
  zvyraznit: boolean;
  doplnky: Doplnky;
}

export const PRAZDNE_DOPLNKY: Doplnky = { osoby: [], meridla: [], opravneni: [], prohlidky: [] };
export const VYCHOZI_MOZNOSTI: Moznosti = { zvyraznit: true, doplnky: PRAZDNE_DOPLNKY };

/**
 * Předložka „v“ / „ve“ před názvem místa (6. pád): „ve“ před v, f a před
 * skupinou souhlásek začínající sykavkou — „Ve Frýdlantu“, „Ve Zlíně“,
 * „Ve Strakonicích“, ale „V Brně“, „V Praze“, „V Sokolově“.
 */
export function predlozkaV(misto: string, velke = true): string {
  const t = misto.trim().toLowerCase();
  const souhlaska = (c: string) => !!c && !"aáeéěiíoóuúůyý0123456789".includes(c);
  const ve = /^[vfw]/.test(t) || (/^[szžšcč]/.test(t) && souhlaska(t[1] ?? ""));
  const p = ve ? "ve" : "v";
  return velke ? p[0].toUpperCase() + p.slice(1) : p;
}

/** Stupně odborné způsobilosti podle § 4–§ 8 NV č. 194/2022 Sb. */
export const STUPNE = ["osoba poučená", "elektrotechnik", "vedoucí elektrotechnik", "revizní technik"] as const;

/** ISO datum + měsíce → ISO datum. */
export function plusMesicu(iso: string, mesicu: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return "";
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1 + mesicu, Number(m[3])));
  return d.toISOString().slice(0, 10);
}

/** Platnost kalibrace měřidla (ISO), nebo prázdné, když datum chybí. */
export function kalibraceDo(m: Pick<MeridloDoc, "kalibraceDatum" | "intervalMesicu">): string {
  return plusMesicu(m.kalibraceDatum, m.intervalMesicu || 12);
}

/** Školení elektrotechniků — nejméně 1× ročně (§ 3 odst. 4 NV č. 194/2022 Sb.). */
export function skoleniDo(o: Pick<OsobaDoc, "skoleniPosledni">): string {
  return plusMesicu(o.skoleniPosledni, 12);
}

/** Počet dní od dneška do data; null, když datum chybí. */
export function dniDo(iso: string, dnes = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const cil = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const dnesUtc = Date.UTC(dnes.getFullYear(), dnes.getMonth(), dnes.getDate());
  return Math.round((cil - dnesUtc) / 86_400_000);
}

/** Stav lhůty pro UI: „Prošlé“, „Blíží se“ (≤ 60 dní), „Platné“, „Chybí datum“. */
export function stavLhuty(iso: string, varovaniDni = 60): string {
  const d = dniDo(iso);
  if (d === null) return "Chybí datum";
  if (d < 0) return "Prošlé";
  if (d <= varovaniDni) return "Blíží se";
  return "Platné";
}

/** První aktivní osoba daného stupně. */
export function osobaStupne(d: Doplnky, stupen: string): OsobaDoc | undefined {
  return d.osoby.find((o) => o.aktivni && o.stupen === stupen);
}

/** Aktivní měřidla seřazená podle názvu. */
export function aktivniMeridla(d: Doplnky): MeridloDoc[] {
  return d.meridla.filter((m) => m.aktivni);
}

/** „Jan Novák, ev. č. 1234/E2A, rozsah E2A, platnost do 01. 02. 2028“ (RT) nebo „…, č. dokladu …“ — prázdné, když osoba chybí. */
export function popisOsoby(o: OsobaDoc | undefined, formatDate: (iso: string) => string): string {
  if (!o || !o.jmeno.trim()) return "";
  const casti = [o.jmeno.trim()];
  if (o.cisloDokladu.trim()) casti.push(`${o.stupen === "revizní technik" ? "ev. č." : "č. dokladu"} ${o.cisloDokladu.trim()}`);
  if (o.rozsah.trim()) casti.push(`rozsah ${o.rozsah.trim()}`);
  if (o.dokladPlatnostDo.trim()) casti.push(`platnost do ${formatDate(o.dokladPlatnostDo)}`);
  return casti.join(", ");
}
