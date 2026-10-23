/** Sestavení sady dokumentů pro zakázku — sdílené oRPC i stahováním. */
import { eq } from "drizzle-orm";
import { db } from "../database";
import { zakazky } from "../database/schema";
import { generujPodleKlice, vsechnyKlice, type Firma, type VysledekDokumentu, type Zakazka } from "./docgen";
import { nactiDoplnky } from "./provoz";
import { nactiFirmu, zvraznitNevyplnene } from "./nastaveni";

export async function nactiZakazku(id: number): Promise<Zakazka & { id: number }> {
  const [row] = await db.select().from(zakazky).where(eq(zakazky.id, id));
  if (!row) throw new Error("Zakázka nenalezena");
  return row as unknown as Zakazka & { id: number };
}

/** Platné klíče dokumentů; prázdný vstup znamená celou sadu. */
export function vyberKlice(klice?: string[]): string[] {
  const vsechny = vsechnyKlice();
  if (!klice || klice.length === 0) return vsechny;
  return vsechny.filter((k) => klice.includes(k));
}

export interface Sada {
  zakazka: Zakazka & { id: number };
  firma: Firma;
  soubory: VysledekDokumentu[];
  zvraznit: boolean;
}

export async function sestavSadu(zakazkaId: number, klice?: string[]): Promise<Sada> {
  const [zakazka, firma, zvraznit, doplnky] = await Promise.all([
    nactiZakazku(zakazkaId),
    nactiFirmu(),
    zvraznitNevyplnene(),
    nactiDoplnky(zakazkaId),
  ]);
  const soubory: VysledekDokumentu[] = [];
  for (const klic of vyberKlice(klice)) {
    soubory.push(await generujPodleKlice(klic, zakazka, firma, { highlight: zvraznit, doplnky }));
  }
  return { zakazka, firma, soubory, zvraznit };
}

/** Název složky zakázky na Disku. */
export function nazevSlozky(zakazka: Zakazka): string {
  const nazev = zakazka.nazevStavby.trim();
  return nazev ? `${zakazka.cislo.trim()} – ${nazev}` : zakazka.cislo.trim();
}
