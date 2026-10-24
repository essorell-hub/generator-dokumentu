/**
 * Zálohování databáze do souboru JSON (ke stažení nebo na Google Disk).
 * Záloha obsahuje všechny tabulky kromě přihlašovacího klíče k Disku.
 */
import { is } from "drizzle-orm";
import { SQLiteTable, getTableConfig } from "drizzle-orm/sqlite-core";
import { db } from "../database";
import * as schema from "../database/schema";
import { jePripojeno, nahrajSoubor, urlSlozky, zajistiSlozku } from "./drive";
import { KLICE, nacti, uloz } from "./nastaveni";

const KLIC_POSLEDNI = "zaloha_posledni";
const NAZEV_SLOZKY = "Zálohy databáze";
const INTERVAL_DNI = 7;

export interface Zaloha {
  nazev: string;
  data: Uint8Array;
  pocetRadku: number;
}

function razitko(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

/** Vytvoří zálohu všech tabulek. */
export async function vytvorZalohu(): Promise<Zaloha> {
  const tabulky: Record<string, unknown[]> = {};
  let pocetRadku = 0;
  for (const hodnota of Object.values(schema)) {
    if (!is(hodnota, SQLiteTable)) continue;
    const { name } = getTableConfig(hodnota);
    let radky = (await db.select().from(hodnota)) as Record<string, unknown>[];
    if (name === "nastaveni") {
      // Přihlašovací klíč k Disku se do zálohy nedává.
      radky = radky.filter((r) => r.klic !== KLICE.driveRefreshToken);
    }
    tabulky[name] = radky;
    pocetRadku += radky.length;
  }
  const obsah = JSON.stringify(
    { aplikace: "generator-dokumentu", verze: 1, vytvoreno: new Date().toISOString(), tabulky },
    null,
    1,
  );
  return {
    nazev: `zaloha-${razitko()}.json`,
    data: new TextEncoder().encode(obsah),
    pocetRadku,
  };
}

export async function posledniZaloha(): Promise<string> {
  return nacti(KLIC_POSLEDNI);
}

export async function stavZalohy() {
  const [posledni, pripojeno, rodic] = await Promise.all([
    posledniZaloha(),
    jePripojeno(),
    nacti(KLICE.driveFolderId),
  ]);
  return { posledni, driveOk: pripojeno && Boolean(rodic), driveChybi: !pripojeno ? "pripojeni" : !rodic ? "slozka" : "" };
}

/** Vytvoří zálohu a nahraje ji do složky „Zálohy databáze“ v cílové složce na Disku. */
export async function zalohujNaDisk(): Promise<{ nazev: string; url: string; slozkaUrl: string; pocetRadku: number }> {
  if (!(await jePripojeno())) throw new Error("Google Disk není připojený (Nastavení → Připojit Drive).");
  const rodic = await nacti(KLICE.driveFolderId);
  if (!rodic) throw new Error("Není vybraná cílová složka na Disku (Nastavení).");
  const zaloha = await vytvorZalohu();
  const slozkaId = await zajistiSlozku(NAZEV_SLOZKY, rodic);
  const soubor = await nahrajSoubor(zaloha.nazev, zaloha.data, slozkaId, "application/json");
  await uloz(KLIC_POSLEDNI, new Date().toISOString());
  return { nazev: zaloha.nazev, url: soubor.url, slozkaUrl: urlSlozky(slozkaId), pocetRadku: zaloha.pocetRadku };
}

async function zkusAutomatickouZalohu(): Promise<void> {
  try {
    const stav = await stavZalohy();
    if (!stav.driveOk) return;
    const posledni = stav.posledni ? Date.parse(stav.posledni) : 0;
    const stari = Date.now() - posledni;
    if (Number.isFinite(posledni) && stari < INTERVAL_DNI * 24 * 3600 * 1000) return;
    const v = await zalohujNaDisk();
    console.log(`Automatická záloha uložena na Disk: ${v.nazev}`);
  } catch (e) {
    console.error("Automatická záloha se nepodařila:", e instanceof Error ? e.message : e);
  }
}

/** Po spuštění a pak každé 3 hodiny zkontroluje, zda není záloha starší než týden. */
export function spustAutomatickouZalohu(): void {
  setTimeout(() => void zkusAutomatickouZalohu(), 30_000);
  setInterval(() => void zkusAutomatickouZalohu(), 3 * 3600 * 1000);
}
