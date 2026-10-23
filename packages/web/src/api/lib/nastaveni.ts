/** Úložiště nastavení a údajů firmy v tabulce `nastaveni`. */
import { eq } from "drizzle-orm";
import { db } from "../database";
import { nastaveni } from "../database/schema";
import type { Firma } from "./docgen";

export const FIRMA_PRAZDNA: Firma = {
  nazev: "",
  adresa: "",
  ico: "",
  dic: "",
  email: "",
  telefon: "",
  web: "",
  ucet: "",
  zapis: "",
  jednatel: "",
  jednatelFunkce: "",
};

export const KLICE = {
  firma: "firma",
  driveRefreshToken: "drive_refresh_token",
  driveEmail: "drive_email",
  driveFolderId: "drive_folder_id",
  driveFolderNazev: "drive_folder_nazev",
  zvraznitNevyplnene: "zvraznit_nevypnene",
} as const;

export async function nacti(klic: string): Promise<string> {
  const [row] = await db.select().from(nastaveni).where(eq(nastaveni.klic, klic));
  return row?.hodnota ?? "";
}

export async function uloz(klic: string, hodnota: string): Promise<void> {
  await db
    .insert(nastaveni)
    .values({ klic, hodnota, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: nastaveni.klic,
      set: { hodnota, updatedAt: new Date() },
    });
}

export async function smaz(klic: string): Promise<void> {
  await db.delete(nastaveni).where(eq(nastaveni.klic, klic));
}

export async function nactiFirmu(): Promise<Firma> {
  const raw = await nacti(KLICE.firma);
  if (!raw) return { ...FIRMA_PRAZDNA };
  try {
    return { ...FIRMA_PRAZDNA, ...(JSON.parse(raw) as Partial<Firma>) };
  } catch {
    return { ...FIRMA_PRAZDNA };
  }
}

export async function ulozFirmu(firma: Firma): Promise<Firma> {
  await uloz(KLICE.firma, JSON.stringify(firma));
  return firma;
}

export async function zvraznitNevyplnene(): Promise<boolean> {
  const raw = await nacti(KLICE.zvraznitNevyplnene);
  return raw === "" ? true : raw === "true";
}
