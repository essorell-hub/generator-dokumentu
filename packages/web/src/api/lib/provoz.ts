/**
 * Provozní agenda kanceláře — osoby, měřidla, oprávnění, provozní deník.
 * Načítá data z databáze a dopočítává lhůty pro přehledy a dokumenty.
 */
import { asc, desc, eq } from "drizzle-orm";
import { db } from "../database";
import { meridla, opravneni, osoby, prohlidky } from "../database/schema";
import type { Doplnky } from "./docgen";
import { dniDo, kalibraceDo, skoleniDo, stavLhuty } from "./docgen/nove/doplnky";

/** Údaje pro generátor; provozní deník jen pro danou zakázku. */
export async function nactiDoplnky(zakazkaId?: number): Promise<Doplnky> {
  const [o, m, op, p] = await Promise.all([
    db.select().from(osoby).orderBy(asc(osoby.jmeno)),
    db.select().from(meridla).orderBy(asc(meridla.nazev)),
    db.select().from(opravneni).orderBy(asc(opravneni.druh)),
    zakazkaId
      ? db.select().from(prohlidky).where(eq(prohlidky.zakazkaId, zakazkaId)).orderBy(asc(prohlidky.datum))
      : Promise.resolve([]),
  ]);
  return { osoby: o, meridla: m, opravneni: op, prohlidky: p };
}

export interface Lhuta {
  co: string;
  datum: string;
  dni: number | null;
  stav: string;
}

function lhuta(co: string, datum: string): Lhuta {
  return { co, datum, dni: dniDo(datum), stav: stavLhuty(datum) };
}

const PORADI_STAVU: Record<string, number> = { "Prošlé": 0, "Blíží se": 1, "Chybí datum": 2, "Platné": 3 };

/** Nejhorší stav ze seznamu lhůt — pro barevný štítek řádku. */
export function nejhorsi(lhuty: Lhuta[]): string {
  return [...lhuty].sort((a, b) => (PORADI_STAVU[a.stav] ?? 9) - (PORADI_STAVU[b.stav] ?? 9))[0]?.stav ?? "Platné";
}

export async function seznamOsob() {
  const rows = await db.select().from(osoby).orderBy(desc(osoby.aktivni), asc(osoby.jmeno));
  return rows.map((r) => {
    const lhuty = [
      lhuta("Doklad o odborné způsobilosti", r.dokladPlatnostDo),
      lhuta("Školení (nejméně 1× ročně)", skoleniDo(r)),
      lhuta("Zdravotní prohlídka", r.zdravotniPristi),
    ];
    return { ...r, skoleniPristi: skoleniDo(r), lhuty, stav: r.aktivni ? nejhorsi(lhuty) : "Neaktivní" };
  });
}

export async function seznamMeridel() {
  const rows = await db.select().from(meridla).orderBy(desc(meridla.aktivni), asc(meridla.nazev));
  return rows.map((r) => {
    const platnost = kalibraceDo(r);
    const l = lhuta("Kalibrace", platnost);
    return { ...r, kalibracePlatnost: platnost, dni: l.dni, stav: r.aktivni ? l.stav : "Neaktivní" };
  });
}

export async function seznamOpravneni() {
  const rows = await db.select().from(opravneni).orderBy(asc(opravneni.platnostDo));
  return rows.map((r) => {
    const l = lhuta(r.druh, r.platnostDo);
    return { ...r, dni: l.dni, stav: r.platnostDo ? l.stav : "Bez omezení" };
  });
}

export async function seznamProhlidek(zakazkaId?: number) {
  const q = db.select().from(prohlidky);
  const rows = zakazkaId
    ? await q.where(eq(prohlidky.zakazkaId, zakazkaId)).orderBy(desc(prohlidky.datum))
    : await q.orderBy(desc(prohlidky.datum));
  return rows;
}

/** Všechny blížící se a prošlé lhůty napříč agendou — pro přehled. */
export async function upozorneni(): Promise<(Lhuta & { kde: string; kdo: string })[]> {
  const [o, m, op] = await Promise.all([seznamOsob(), seznamMeridel(), seznamOpravneni()]);
  const out: (Lhuta & { kde: string; kdo: string })[] = [];
  for (const r of o) {
    if (!r.aktivni) continue;
    for (const l of r.lhuty) if (l.stav === "Prošlé" || l.stav === "Blíží se") out.push({ ...l, kde: "Osoby", kdo: r.jmeno });
  }
  for (const r of m) {
    if (r.aktivni && (r.stav === "Prošlé" || r.stav === "Blíží se"))
      out.push({ co: "Kalibrace", datum: r.kalibracePlatnost, dni: r.dni, stav: r.stav, kde: "Měřidla", kdo: [r.nazev, r.vyrobniCislo].filter(Boolean).join(" · ") });
  }
  for (const r of op) {
    if (r.stav === "Prošlé" || r.stav === "Blíží se")
      out.push({ co: r.druh, datum: r.platnostDo, dni: r.dni, stav: r.stav, kde: "Oprávnění", kdo: r.cislo });
  }
  return out.sort((a, b) => (a.dni ?? 0) - (b.dni ?? 0));
}
