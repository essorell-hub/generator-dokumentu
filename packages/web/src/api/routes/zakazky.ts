import { ORPCError } from "@orpc/server";
import { and, desc, eq, isNotNull, isNull, like, or, sql } from "drizzle-orm";
import { z } from "zod";
import { base } from "../__core/app";
import { db } from "../database";
import { dokumenty, evidence, zakazky } from "../database/schema";
import { synchronizujEvidence, zajistiEvidence } from "../lib/agenda/data";

const textPole = z.string().trim().optional();

const vstupZakazky = z.object({
  cislo: z.string().trim().min(1, "Číslo zakázky je povinné"),
  revize: textPole,
  nazevStavby: textPole,
  nazevObjektu: textPole,
  poznamka: textPole,
  stav: textPole,
  adresaStavby: textPole,
  parcela: textPole,
  katastr: textPole,
  kraj: textPole,
  typStavby: textPole,
  stupenDokumentace: textPole,
  castDokumentace: textPole,
  prilohaVyhlasky: textPole,
  profese: textPole,
  investor: textPole,
  investorAdresa: textPole,
  investorIco: textPole,
  investorDic: textPole,
  investorZastupce: textPole,
  zakaznik: textPole,
  zakaznikAdresa: textPole,
  zakaznikIco: textPole,
  zakaznikDic: textPole,
  zakaznikZastupce: textPole,
  zakaznikKontakt: textPole,
  projektantJmeno: textPole,
  projektantAutorizace: textPole,
  projektantObor: textPole,
  projektantSpecializace: textPole,
  zpracovatelJmeno: textPole,
  elektroTechnikJmeno: textPole,
  elektroTechnikAutorizace: textPole,
  datum: textPole,
  datumMistnihoSetreni: textPole,
  datumPristiRevize: textPole,
  cisloZpravy: textPole,
  cisloNabidky: textPole,
  cisloDokumentu: textPole,
  mistoPodpisu: textPole,
  soustava: textPole,
  jistic: textPole,
  rezervovanyPrikon: textPole,
  vykonFve: textPole,
  distributor: textPole,
});

type VstupZakazky = z.infer<typeof vstupZakazky>;

/** Zahodí `undefined`, aby se nepřepsaly výchozí hodnoty sloupců. */
function ocisti(input: Partial<VstupZakazky>): Partial<VstupZakazky> {
  return Object.fromEntries(
    Object.entries(input).filter(([, v]) => v !== undefined),
  ) as Partial<VstupZakazky>;
}

export const zakazkyRouter = {
  /** Seznam zakázek, volitelně filtrovaný hledáním a stavem. */
  seznam: base
    .input(
      z
        .object({
          hledat: z.string().trim().optional(),
          stav: z.string().trim().optional(),
        })
        .optional(),
    )
    .handler(async ({ input }) => {
      const hledat = input?.hledat?.trim();
      const stav = input?.stav?.trim();
      const podminky = [isNull(zakazky.smazanoAt)];
      if (hledat) {
        podminky.push(
          or(
            like(zakazky.cislo, `%${hledat}%`),
            like(zakazky.nazevStavby, `%${hledat}%`),
            like(zakazky.investor, `%${hledat}%`),
            like(zakazky.katastr, `%${hledat}%`),
          ),
        );
      }
      if (stav) podminky.push(eq(zakazky.stav, stav));

      const radky = await db
        .select()
        .from(zakazky)
        .where(and(...podminky))
        .orderBy(desc(zakazky.updatedAt));

      const soubory = await db
        .select({ zakazkaId: dokumenty.zakazkaId, pocet: sql<number>`count(*)` })
        .from(dokumenty)
        .groupBy(dokumenty.zakazkaId);
      const pocty = new Map(soubory.map((s) => [s.zakazkaId, Number(s.pocet)]));

      return radky.map((z) => ({ ...z, pocetDokumentu: pocty.get(z.id) ?? 0 }));
    }),

  detail: base.input(z.object({ id: z.number() })).handler(async ({ input }) => {
    const [zakazka] = await db
      .select()
      .from(zakazky)
      .where(and(eq(zakazky.id, input.id), isNull(zakazky.smazanoAt)));
    if (!zakazka) throw new ORPCError("NOT_FOUND", { message: "Zakázka nenalezena (je možná v koši)" });
    const soubory = await db
      .select()
      .from(dokumenty)
      .where(eq(dokumenty.zakazkaId, input.id))
      .orderBy(desc(dokumenty.createdAt));
    return { zakazka, soubory };
  }),

  vytvorit: base.input(vstupZakazky).handler(async ({ input }) => {
    const [zakazka] = await db
      .insert(zakazky)
      .values({ ...ocisti(input), cislo: input.cislo })
      .returning();
    // Každá zakázka se zakládá i v obchodním rejstříku, aby se na ni
    // nezapomnělo při fakturaci a předání provozní dokumentace.
    await zajistiEvidence(zakazka.id);
    return zakazka;
  }),

  upravit: base
    .input(
      vstupZakazky.partial({ cislo: true }).extend({
        id: z.number(),
        /** Čas poslední změny, který uživatel viděl při načtení (ms). Neshoda = mezitím někdo upravil. */
        ocekavanaZmena: z.number().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const { id, ocekavanaZmena, ...zmeny } = input;

      if (ocekavanaZmena !== undefined) {
        const [soucasna] = await db
          .select({ updatedAt: zakazky.updatedAt })
          .from(zakazky)
          .where(eq(zakazky.id, id));
        if (soucasna && soucasna.updatedAt.getTime() !== ocekavanaZmena) {
          throw new ORPCError("CONFLICT", {
            message: "Zakázku mezitím změnil někdo jiný.",
            data: { zmeneno: soucasna.updatedAt.getTime() },
          });
        }
      }

      const [zakazka] = await db
        .update(zakazky)
        .set({ ...ocisti(zmeny), updatedAt: new Date() })
        .where(and(eq(zakazky.id, id), isNull(zakazky.smazanoAt)))
        .returning();
      if (!zakazka) throw new ORPCError("NOT_FOUND", { message: "Zakázka nenalezena" });
      // Identifikační údaje držíme v souladu s rejstříkem.
      await synchronizujEvidence(zakazka.id);
      return zakazka;
    }),

  /** Přesune zakázku do koše. Dokumenty ani rejstřík se nemažou, zakázku lze obnovit. */
  smazat: base.input(z.object({ id: z.number() })).handler(async ({ input }) => {
    await db.update(zakazky).set({ smazanoAt: new Date() }).where(eq(zakazky.id, input.id));
    return { ok: true };
  }),

  /** Zakázky v koši. */
  kos: base.handler(async () => {
    const radky = await db
      .select()
      .from(zakazky)
      .where(isNotNull(zakazky.smazanoAt))
      .orderBy(desc(zakazky.smazanoAt));
    return radky.map((z) => ({
      id: z.id,
      cislo: z.cislo,
      nazevStavby: z.nazevStavby,
      investor: z.investor,
      smazanoAt: z.smazanoAt,
    }));
  }),

  /** Vrátí zakázku z koše zpět. */
  obnovit: base.input(z.object({ id: z.number() })).handler(async ({ input }) => {
    await db
      .update(zakazky)
      .set({ smazanoAt: null, updatedAt: new Date() })
      .where(eq(zakazky.id, input.id));
    return { ok: true };
  }),

  /** Nevratně smaže zakázku z koše včetně záznamů o jejích dokumentech. */
  smazatTrvale: base.input(z.object({ id: z.number() })).handler(async ({ input }) => {
    const [z1] = await db
      .select({ smazanoAt: zakazky.smazanoAt })
      .from(zakazky)
      .where(eq(zakazky.id, input.id));
    if (!z1?.smazanoAt) {
      throw new ORPCError("BAD_REQUEST", { message: "Trvale lze smazat jen zakázku z koše." });
    }
    await db.delete(dokumenty).where(eq(dokumenty.zakazkaId, input.id));
    // Řádek v rejstříku zůstává — fakturační a obchodní stopa se nemaže.
    await db.update(evidence).set({ zakazkaId: null }).where(eq(evidence.zakazkaId, input.id));
    await db.delete(zakazky).where(eq(zakazky.id, input.id));
    return { ok: true };
  }),

  /** Návrh dalšího čísla zakázky ve tvaru RRRR-NNN. */
  dalsiCislo: base.handler(async () => {
    const rok = new Date().getFullYear();
    const radky = await db
      .select({ cislo: zakazky.cislo })
      .from(zakazky)
      .where(like(zakazky.cislo, `${rok}-%`));
    let max = 0;
    for (const { cislo } of radky) {
      const m = new RegExp(`^${rok}-(\\d{1,4})$`).exec(cislo.trim());
      if (m) max = Math.max(max, Number(m[1]));
    }
    const dalsi = String(max + 1).padStart(3, "0");
    const dnes = new Date().toISOString().slice(0, 10);
    return {
      cislo: `${rok}-${dalsi}`,
      cisloZpravy: `${rok}-${dalsi}-REV`,
      cisloNabidky: `${rok}-${dalsi}-N`,
      cisloDokumentu: `${rok}-${dalsi}-R-01-EL-TZ-01`,
      datum: dnes,
      mistoPodpisu: "",
    };
  }),
};
