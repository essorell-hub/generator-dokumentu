import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { base } from "../__core/app";
import { db } from "../database";
import { dokumenty, zakazky } from "../database/schema";
import { docCatalog, zkontroluj } from "../lib/docgen";
import { nactiFirmu, nacti, KLICE } from "../lib/nastaveni";
import { jePripojeno, nahrajSoubor, zajistiSlozku, urlSlozky, DriveChyba } from "../lib/drive";
import { nactiZakazku, nazevSlozky, sestavSadu, vyberKlice } from "../lib/sada";
import { nactiDoplnky } from "../lib/provoz";

const vstupKlice = z.object({
  zakazkaId: z.number(),
  klice: z.array(z.string()).optional(),
});

export const generovaniRouter = {
  /** Katalog dokumentů, které umí aplikace vygenerovat. */
  katalog: base.handler(() => docCatalog()),

  /** Kolik nevyplněných míst zůstane v jednotlivých dokumentech. */
  kontrola: base.input(vstupKlice).handler(async ({ input }) => {
    const [zakazka, firma, doplnky] = await Promise.all([
      nactiZakazku(input.zakazkaId),
      nactiFirmu(),
      nactiDoplnky(input.zakazkaId),
    ]);
    return Promise.all(vyberKlice(input.klice).map((klic) => zkontroluj(klic, zakazka, firma, doplnky)));
  }),

  /** Vygeneruje vybrané dokumenty a nahraje je do složky zakázky na Disku. */
  generovat: base.input(vstupKlice).handler(async ({ input }) => {
    const { zakazka, soubory } = await sestavSadu(input.zakazkaId, input.klice);

    const pripojeno = await jePripojeno();
    const rodic = await nacti(KLICE.driveFolderId);
    let slozkaId = "";
    let chybaSlozky = "";

    if (pripojeno && rodic) {
      try {
        slozkaId = await zajistiSlozku(nazevSlozky(zakazka), rodic);
      } catch (e) {
        chybaSlozky = e instanceof Error ? e.message : String(e);
      }
    }

    const vysledky = [];
    for (const soubor of soubory) {
      let driveFileId = "";
      let driveUrl = "";
      let stav = "ok";
      let chyba = "";

      if (slozkaId) {
        try {
          const nahrano = await nahrajSoubor(soubor.nazevSouboru, soubor.data, slozkaId);
          driveFileId = nahrano.id;
          driveUrl = nahrano.url;
        } catch (e) {
          stav = "chyba";
          chyba = e instanceof DriveChyba ? e.message : e instanceof Error ? e.message : String(e);
        }
      } else {
        stav = pripojeno ? (rodic ? "chyba" : "bez_slozky") : "drive_ne";
        chyba = pripojeno
          ? rodic
            ? chybaSlozky || "Nahrání na Drive se nezdařilo."
            : "Není vybraná cílová složka na Disku."
          : "";
      }

      await db
        .delete(dokumenty)
        .where(and(eq(dokumenty.zakazkaId, input.zakazkaId), eq(dokumenty.klic, soubor.klic)));
      await db.insert(dokumenty).values({
        zakazkaId: input.zakazkaId,
        klic: soubor.klic,
        nazev: soubor.nazev,
        nazevSouboru: soubor.nazevSouboru,
        revize: soubor.revize,
        driveFileId,
        driveUrl,
        velikost: soubor.data.byteLength,
        nevyplneno: soubor.nevyplneno.length,
        stav,
      });

      vysledky.push({
        klic: soubor.klic,
        nazev: soubor.nazev,
        nazevSouboru: soubor.nazevSouboru,
        nevyplneno: soubor.nevyplneno,
        driveFileId,
        driveUrl,
        stav,
        chyba,
      });
    }

    await db
      .update(zakazky)
      .set({ stav: "vygenerovano", updatedAt: new Date() })
      .where(eq(zakazky.id, input.zakazkaId));

    return {
      slozkaId,
      slozkaUrl: slozkaId ? urlSlozky(slozkaId) : "",
      slozkaNazev: nazevSlozky(zakazka),
      pripojeno,
      maSlozku: Boolean(rodic),
      vysledky,
    };
  }),

  /** Poslední vygenerované soubory zakázky. */
  historie: base.input(z.object({ zakazkaId: z.number() })).handler(async ({ input }) => {
    return db.select().from(dokumenty).where(eq(dokumenty.zakazkaId, input.zakazkaId));
  }),

  smazatZaznam: base.input(z.object({ ids: z.array(z.number()) })).handler(async ({ input }) => {
    if (input.ids.length) {
      await db.delete(dokumenty).where(inArray(dokumenty.id, input.ids));
    }
    return { ok: true };
  }),
};
