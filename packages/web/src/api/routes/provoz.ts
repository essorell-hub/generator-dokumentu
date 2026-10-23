/**
 * Provozní agenda kanceláře: osoby a odborná způsobilost, měřidla
 * a kalibrace, oprávnění firmy, provozní deník a souhrn lhůt.
 */
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { base } from "../__core/app";
import { db } from "../database";
import { meridla, opravneni, osoby, prohlidky } from "../database/schema";
import { STUPNE } from "../lib/docgen/nove/doplnky";
import {
  seznamMeridel,
  seznamOpravneni,
  seznamOsob,
  seznamProhlidek,
  upozorneni,
} from "../lib/provoz";

const txt = z.string().trim().default("");
const id = z.object({ id: z.number() });

/** Rozlišovací znaky osvědčení RT (příloha č. 5 NV č. 190/2022 Sb.); oprávnění firmy používá stejné znaky (příloha č. 3). */
const ROZSAHY = ["E1A", "E1B", "E2A", "E2B", "E3A", "E3B"];

const DRUHY_OPRAVNENI = [
  "Oprávnění TIČR — montáž, opravy, revize a zkoušky VEZ",
  "Živnostenské oprávnění — montáž, opravy, údržba a revize VEZ",
  "Osvědčení revizního technika",
  "Pojištění odpovědnosti",
  "Autorizace ČKAIT",
  "Jiné",
];

const DRUHY_PROHLIDKY = ["Prohlídka", "Zkouška", "Údržba", "Oprava", "Revize", "Mimořádná událost"];

const vstupOsoba = z.object({
  id: z.number().optional(),
  jmeno: z.string().trim().min(1, "Vyplňte jméno"),
  funkce: txt,
  stupen: z.string().trim().default("elektrotechnik"),
  rozsah: txt,
  cisloDokladu: txt,
  dokladPlatnostDo: txt,
  skoleniPosledni: txt,
  zdravotniPosledni: txt,
  zdravotniPristi: txt,
  datumNarozeni: txt,
  telefon: txt,
  email: txt,
  aktivni: z.boolean().default(true),
  poznamka: txt,
});

const vstupMeridlo = z.object({
  id: z.number().optional(),
  nazev: z.string().trim().min(1, "Vyplňte název přístroje"),
  vyrobce: txt,
  typ: txt,
  vyrobniCislo: txt,
  kalibracniList: txt,
  kalibraceDatum: txt,
  intervalMesicu: z.number().int().min(1).max(120).default(12),
  kalibroval: txt,
  aktivni: z.boolean().default(true),
  poznamka: txt,
});

const vstupOpravneni = z.object({
  id: z.number().optional(),
  druh: z.string().trim().min(1, "Vyberte druh"),
  cislo: txt,
  rozsah: txt,
  vydal: txt,
  platnostOd: txt,
  platnostDo: txt,
  poznamka: txt,
});

const vstupProhlidka = z.object({
  id: z.number().optional(),
  zakazkaId: z.number().nullable().optional(),
  datum: z.string().trim().min(1, "Vyplňte datum"),
  druh: z.string().trim().default("Prohlídka"),
  rozsah: txt,
  provedl: txt,
  vysledek: txt,
  zavada: txt,
  odstraneno: txt,
  poznamka: txt,
});

function nenalezeno(): never {
  throw new ORPCError("NOT_FOUND", { message: "Záznam nenalezen" });
}

export const provozRouter = {
  ciselniky: base.handler(() => ({
    stupne: [...STUPNE],
    rozsahy: ROZSAHY,
    druhyOpravneni: DRUHY_OPRAVNENI,
    druhyProhlidky: DRUHY_PROHLIDKY,
  })),

  upozorneni: base.handler(() => upozorneni()),

  osoby: base.handler(() => seznamOsob()),
  ulozitOsobu: base.input(vstupOsoba).handler(async ({ input }) => {
    const { id: i, ...data } = input;
    if (i) {
      const [r] = await db.update(osoby).set({ ...data, updatedAt: new Date() }).where(eq(osoby.id, i)).returning();
      return r ?? nenalezeno();
    }
    const [r] = await db.insert(osoby).values(data).returning();
    return r;
  }),
  smazatOsobu: base.input(id).handler(async ({ input }) => {
    await db.delete(osoby).where(eq(osoby.id, input.id));
    return { ok: true };
  }),

  meridla: base.handler(() => seznamMeridel()),
  ulozitMeridlo: base.input(vstupMeridlo).handler(async ({ input }) => {
    const { id: i, ...data } = input;
    if (i) {
      const [r] = await db.update(meridla).set({ ...data, updatedAt: new Date() }).where(eq(meridla.id, i)).returning();
      return r ?? nenalezeno();
    }
    const [r] = await db.insert(meridla).values(data).returning();
    return r;
  }),
  smazatMeridlo: base.input(id).handler(async ({ input }) => {
    await db.delete(meridla).where(eq(meridla.id, input.id));
    return { ok: true };
  }),

  opravneni: base.handler(() => seznamOpravneni()),
  ulozitOpravneni: base.input(vstupOpravneni).handler(async ({ input }) => {
    const { id: i, ...data } = input;
    if (i) {
      const [r] = await db.update(opravneni).set({ ...data, updatedAt: new Date() }).where(eq(opravneni.id, i)).returning();
      return r ?? nenalezeno();
    }
    const [r] = await db.insert(opravneni).values(data).returning();
    return r;
  }),
  smazatOpravneni: base.input(id).handler(async ({ input }) => {
    await db.delete(opravneni).where(eq(opravneni.id, input.id));
    return { ok: true };
  }),

  prohlidky: base
    .input(z.object({ zakazkaId: z.number().optional() }))
    .handler(({ input }) => seznamProhlidek(input.zakazkaId)),
  ulozitProhlidku: base.input(vstupProhlidka).handler(async ({ input }) => {
    const { id: i, zakazkaId, ...rest } = input;
    const data = { ...rest, zakazkaId: zakazkaId ?? null };
    if (i) {
      const [r] = await db.update(prohlidky).set({ ...data, updatedAt: new Date() }).where(eq(prohlidky.id, i)).returning();
      return r ?? nenalezeno();
    }
    const [r] = await db.insert(prohlidky).values(data).returning();
    return r;
  }),
  smazatProhlidku: base.input(id).handler(async ({ input }) => {
    await db.delete(prohlidky).where(eq(prohlidky.id, input.id));
    return { ok: true };
  }),
};
