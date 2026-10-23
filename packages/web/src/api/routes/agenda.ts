/**
 * Agendové procedury: rejstřík zakázek, hlídání revizních lhůt, rejstřík norem
 * a e-mailové šablony.
 *
 * Nic z toho neodesílá e-maily ani nezapisuje na Disk samo — appka připraví
 * podklady, potvrzení zůstává na uživateli.
 */
import { ORPCError } from "@orpc/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { base } from "../__core/app";
import { db } from "../database";
import {
  emailSablony,
  emailZpravy,
  evidence,
  normy,
  periodickeRevize,
  terminyZmeny,
} from "../database/schema";
import {
  DRUHY_NORMY,
  LHUTY_MOZNOSTI,
  STAVY_NORMY,
  STAVY_ZAKAZKY,
  TYPY_ZAKAZKY,
  ANO_NE,
  DRUHY_REVIZE,
} from "../lib/agenda/ciselnik";
import {
  dnesISO,
  lhutyProVyber,
  seznamEvidence,
  seznamNormy,
  seznamRevizi,
  seznamSablony,
  seznamTerminu,
  seznamZprav,
  seznamZpravZakazky,
  souhrnEvidence,
  souhrnNormy,
  souhrnRevizi,
  synchronizujEvidence,
  zakazkyBezEvidence,
  zajistiEvidence,
  zajistiVychoziData,
} from "../lib/agenda/data";
import {
  DOSTUPNE_ZNACKY,
  gmailOdkaz,
  mailtoOdkaz,
  sestavMail,
} from "../lib/agenda/maily";

const datumPole = z.string().trim().optional();

// ------------------------------------------------------------ rejstřík zakázek

const vstupEvidence = z.object({
  id: z.number().optional(),
  zakazkaId: z.number().nullable().optional(),
  cislo: z.string().trim().default(""),
  nazev: z.string().trim().default(""),
  klient: z.string().trim().default(""),
  kontakt: z.string().trim().default(""),
  typ: z.string().trim().default(""),
  stav: z.string().trim().default("Poptávka"),
  datumPoptavky: datumPole,
  terminOdevzdani: datumPole,
  datumPredani: datumPole,
  revizeDokumentace: datumPole,
  datumRevize: datumPole,
  cenaBezDph: z.number().int().min(0).default(0),
  cisloFaktury: datumPole,
  datumFakturace: datumPole,
  datumUhrady: datumPole,
  fakturovano: z.string().trim().default("Ne"),
  zaplaceno: z.string().trim().default("Ne"),
  posouzeniEru: z.string().trim().default("Ne"),
  predaniProvozniDokumentace: z.string().trim().default("Ne"),
  odkazNaSlozku: datumPole,
  poznamka: datumPole,
});

export const rejstrikRouter = {
  seznam: base
    .input(
      z
        .object({
          hledat: z.string().trim().optional(),
          typ: z.string().trim().optional(),
          stav: z.string().trim().optional(),
          rok: z.string().trim().optional(),
          nezaplaceno: z.boolean().optional(),
        })
        .optional(),
    )
    .handler(async ({ input }) => {
      await zajistiVychoziData();
      const [radky, souhrn] = await Promise.all([
        seznamEvidence(input ?? {}),
        souhrnEvidence(),
      ]);
      return {
        radky,
        souhrn,
        ciselnik: {
          typy: TYPY_ZAKAZKY,
          stavy: STAVY_ZAKAZKY,
          anoNe: ANO_NE,
        },
      };
    }),

  detail: base.input(z.object({ id: z.number() })).handler(async ({ input }) => {
    const [radek] = await db.select().from(evidence).where(eq(evidence.id, input.id));
    if (!radek) throw new ORPCError("NOT_FOUND", { message: "Záznam nenalezen" });
    return radek;
  }),

  /** Založí nebo upraví řádek rejstříku. Prázdné id znamená nový záznam. */
  ulozit: base.input(vstupEvidence).handler(async ({ input }) => {
    const { id, ...hodnoty } = input;
    const data = Object.fromEntries(
      Object.entries(hodnoty).map(([k, v]) => [k, v ?? ""]),
    ) as typeof hodnoty;
    if (id) {
      const [radek] = await db
        .update(evidence)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(evidence.id, id))
        .returning();
      if (!radek) throw new ORPCError("NOT_FOUND", { message: "Záznam nenalezen" });
      return radek;
    }
    const [radek] = await db
      .insert(evidence)
      .values({ ...data, cenaBezDph: hodnoty.cenaBezDph ?? 0 })
      .returning();
    return radek;
  }),

  smazat: base.input(z.object({ id: z.number() })).handler(async ({ input }) => {
    await db.delete(evidence).where(eq(evidence.id, input.id));
    return { ok: true };
  }),

  /** Založí řádek rejstříku pro zakázku z generátoru a přenese její údaje. */
  prepojitZakazku: base
    .input(z.object({ zakazkaId: z.number() }))
    .handler(async ({ input }) => {
      const radek = await zajistiEvidence(input.zakazkaId);
      if (!radek) throw new ORPCError("NOT_FOUND", { message: "Zakázka nenalezena" });
      await synchronizujEvidence(input.zakazkaId);
      const [aktualni] = await db.select().from(evidence).where(eq(evidence.id, radek.id));
      return aktualni;
    }),

  /** Zakázky z generátoru, které ještě v rejstříku nejsou. */
  bezEvidence: base.handler(() => zakazkyBezEvidence()),

  souhrn: base.handler(() => souhrnEvidence()),
};

// ------------------------------------------------------------ revizní lhůty

const vstupRevize = z.object({
  id: z.number().optional(),
  zakazkaId: z.number().nullable().optional(),
  klient: z.string().trim().default(""),
  objekt: z.string().trim().default(""),
  druhRevize: z.string().trim().default("Pravidelná"),
  datumPosledniRevize: datumPole,
  lhutaDni: z.number().int().positive().default(1826),
  lhutaText: datumPole,
  kontakt: datumPole,
  poznamka: datumPole,
});

export const revizeRouter = {
  seznam: base.handler(async () => {
    await zajistiVychoziData();
    const [radky, souhrn] = await Promise.all([seznamRevizi(), souhrnRevizi()]);
    return {
      radky,
      souhrn,
      lhuty: lhutyProVyber(),
      druhy: DRUHY_REVIZE,
      lhutyMoznosti: LHUTY_MOZNOSTI,
    };
  }),

  ulozit: base.input(vstupRevize).handler(async ({ input }) => {
    const { id, ...hodnoty } = input;
    const data = Object.fromEntries(
      Object.entries(hodnoty).map(([k, v]) => [k, v ?? ""]),
    ) as typeof hodnoty;
    if (id) {
      const [radek] = await db
        .update(periodickeRevize)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(periodickeRevize.id, id))
        .returning();
      if (!radek) throw new ORPCError("NOT_FOUND", { message: "Záznam nenalezen" });
      return radek;
    }
    const [radek] = await db
      .insert(periodickeRevize)
      .values({ ...data, lhutaDni: hodnoty.lhutaDni ?? 1826 })
      .returning();
    return radek;
  }),

  smazat: base.input(z.object({ id: z.number() })).handler(async ({ input }) => {
    await db.delete(periodickeRevize).where(eq(periodickeRevize.id, input.id));
    return { ok: true };
  }),
};

// ------------------------------------------------------------ rejstřík norem

const vstupNorma = z.object({
  id: z.number().optional(),
  poradi: z.number().int().default(0),
  oznaceni: z.string().trim().default(""),
  nazev: z.string().trim().default(""),
  edice: z.string().trim().default(""),
  druh: z.string().trim().default("ČSN"),
  ucinnostOd: datumPole,
  prechodneDo: datumPole,
  pouziti: datumPole,
  posledniOvereni: datumPole,
  overil: datumPole,
  stav: z.string().trim().default("platná"),
  zjistenaEdice: datumPole,
  odkazOverit: datumPole,
  poznamka: datumPole,
});

export const normyRouter = {
  seznam: base
    .input(
      z
        .object({
          hledat: z.string().trim().optional(),
          druh: z.string().trim().optional(),
          stav: z.string().trim().optional(),
          kontrola: z.string().trim().optional(),
        })
        .optional(),
    )
    .handler(async ({ input }) => {
      await zajistiVychoziData();
      const [radky, souhrn, terminy] = await Promise.all([
        seznamNormy(input ?? {}),
        souhrnNormy(),
        seznamTerminu(),
      ]);
      return {
        radky,
        souhrn,
        terminy,
        ciselnik: { druhy: DRUHY_NORMY, stavy: STAVY_NORMY, kontrola: ["OK", "PO TERMÍNU", "AKTUALIZOVAT", "NEOVĚŘENO"] },
      };
    }),

  ulozit: base.input(vstupNorma).handler(async ({ input }) => {
    const { id, ...hodnoty } = input;
    const data = Object.fromEntries(
      Object.entries(hodnoty).map(([k, v]) => [k, v ?? ""]),
    ) as typeof hodnoty;
    if (id) {
      const [radek] = await db
        .update(normy)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(normy.id, id))
        .returning();
      if (!radek) throw new ORPCError("NOT_FOUND", { message: "Norma nenalezena" });
      return radek;
    }
    const [max] = await db.select({ poradi: normy.poradi }).from(normy).orderBy(asc(normy.poradi));
    const [radek] = await db
      .insert(normy)
      .values({ ...data, poradi: hodnoty.poradi || (max?.poradi ?? 0) + 1 })
      .returning();
    return radek;
  }),

  /** Rychlé „ověřeno“ — zapíše zjištěnou edici a dnešní datum. */
  oznacitOvereno: base
    .input(
      z.object({
        id: z.number(),
        zjistenaEdice: z.string().trim().optional(),
        posledniOvereni: z.string().trim().optional(),
        overil: z.string().trim().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const { id, ...zmeny } = input;
      const [radek] = await db
        .update(normy)
        .set({
          zjistenaEdice: zmeny.zjistenaEdice ?? "",
          posledniOvereni: zmeny.posledniOvereni || dnesISO(),
          overil: zmeny.overil ?? "",
          updatedAt: new Date(),
        })
        .where(eq(normy.id, id))
        .returning();
      if (!radek) throw new ORPCError("NOT_FOUND", { message: "Norma nenalezena" });
      return radek;
    }),

  smazat: base.input(z.object({ id: z.number() })).handler(async ({ input }) => {
    await db.delete(normy).where(eq(normy.id, input.id));
    return { ok: true };
  }),

  // ------------------------------------------------ termíny a změny
  terminy: base.handler(() => seznamTerminu()),

  ulozitTermin: base
    .input(
      z.object({
        id: z.number().optional(),
        datum: z.string().trim().default(""),
        co: z.string().trim().default(""),
        dopad: z.string().trim().default(""),
        odpovida: z.string().trim().default(""),
        stav: z.string().trim().default(""),
      }),
    )
    .handler(async ({ input }) => {
      const { id, ...hodnoty } = input;
      if (id) {
        const [radek] = await db
          .update(terminyZmeny)
          .set(hodnoty)
          .where(eq(terminyZmeny.id, id))
          .returning();
        return radek;
      }
      const [radek] = await db.insert(terminyZmeny).values(hodnoty).returning();
      return radek;
    }),

  smazatTermin: base.input(z.object({ id: z.number() })).handler(async ({ input }) => {
    await db.delete(terminyZmeny).where(eq(terminyZmeny.id, input.id));
    return { ok: true };
  }),
};

// ------------------------------------------------------------ e-mailové šablony

const vstupSablona = z.object({
  id: z.number().optional(),
  nazev: z.string().trim().min(1, "Název šablony je povinný"),
  kategorie: z.string().trim().default("Obecné"),
  predmet: z.string().trim().default(""),
  telo: z.string().default(""),
  poradi: z.number().int().default(0),
});

export const mailyRouter = {
  znacky: base.handler(() => DOSTUPNE_ZNACKY),

  sablony: base.handler(async () => {
    await zajistiVychoziData();
    return seznamSablony();
  }),

  ulozitSablonu: base.input(vstupSablona).handler(async ({ input }) => {
    const { id, ...hodnoty } = input;
    if (id) {
      const [radek] = await db
        .update(emailSablony)
        .set({ ...hodnoty, updatedAt: new Date() })
        .where(eq(emailSablony.id, id))
        .returning();
      if (!radek) throw new ORPCError("NOT_FOUND", { message: "Šablona nenalezena" });
      return radek;
    }
    const [radek] = await db.insert(emailSablony).values(hodnoty).returning();
    return radek;
  }),

  smazatSablonu: base.input(z.object({ id: z.number() })).handler(async ({ input }) => {
    await db.delete(emailSablony).where(eq(emailSablony.id, input.id));
    return { ok: true };
  }),

  /** Sestaví e-mail ze šablony a dat zakázky. Nic neodesílá. */
  sestavit: base
    .input(
      z.object({
        zakazkaId: z.number().optional(),
        sablonaId: z.number().optional(),
        predmet: z.string().optional(),
        telo: z.string().optional(),
        komu: z.string().trim().optional(),
        kopie: z.string().trim().optional(),
      }),
    )
    .handler(async ({ input }) => {
      let sablona: { nazev: string; predmet: string; telo: string } | undefined;
      if (input.sablonaId) {
        const [s] = await db
          .select()
          .from(emailSablony)
          .where(eq(emailSablony.id, input.sablonaId));
        if (s) sablona = { nazev: s.nazev, predmet: s.predmet, telo: s.telo };
      }
      if (!sablona && (input.predmet !== undefined || input.telo !== undefined)) {
        sablona = { nazev: "Vlastní", predmet: input.predmet ?? "", telo: input.telo ?? "" };
      }
      const mail = await sestavMail({
        zakazkaId: input.zakazkaId,
        sablona,
        komu: input.komu,
        kopie: input.kopie,
      });
      return {
        ...mail,
        gmail: gmailOdkaz(mail),
        mailto: mailtoOdkaz(mail),
      };
    }),

  /** Zapíše zprávu do historie — po odeslání ji uživatel označí jako odeslanou. */
  zaznamenat: base
    .input(
      z.object({
        zakazkaId: z.number().nullable().optional(),
        sablonaId: z.number().nullable().optional(),
        sablonaNazev: z.string().trim().default(""),
        komu: z.string().trim().default(""),
        kopie: z.string().trim().default(""),
        predmet: z.string().trim().default(""),
        telo: z.string().default(""),
        stav: z.string().trim().default("pripraveno"),
        poznamka: z.string().trim().default(""),
      }),
    )
    .handler(async ({ input }) => {
      const [radek] = await db.insert(emailZpravy).values(input).returning();
      return radek;
    }),

  historie: base
    .input(z.object({ zakazkaId: z.number().optional() }).optional())
    .handler(async ({ input }) => {
      if (input?.zakazkaId) return seznamZpravZakazky(input.zakazkaId);
      return seznamZprav();
    }),

  zmenitStavZpravy: base
    .input(z.object({ id: z.number(), stav: z.string().trim() }))
    .handler(async ({ input }) => {
      const [radek] = await db
        .update(emailZpravy)
        .set({ stav: input.stav })
        .where(eq(emailZpravy.id, input.id))
        .returning();
      return radek;
    }),

  smazatZpravu: base.input(z.object({ id: z.number() })).handler(async ({ input }) => {
    await db.delete(emailZpravy).where(eq(emailZpravy.id, input.id));
    return { ok: true };
  }),
};