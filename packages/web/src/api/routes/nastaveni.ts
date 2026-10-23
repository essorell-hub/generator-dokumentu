import { z } from "zod";
import { base } from "../__core/app";
import {
  odpoj,
  seznamSlozek,
  stavPripojeni,
  ulozSlozku,
  maKonfiguraci,
  prehlasovaciUri,
} from "../lib/drive";
import {
  KLICE,
  nactiFirmu,
  smaz,
  uloz,
  ulozFirmu,
  zvraznitNevyplnene,
} from "../lib/nastaveni";

const firmaSchema = z.object({
  nazev: z.string().trim().default(""),
  adresa: z.string().trim().default(""),
  ico: z.string().trim().default(""),
  dic: z.string().trim().default(""),
  email: z.string().trim().default(""),
  telefon: z.string().trim().default(""),
  web: z.string().trim().default(""),
  ucet: z.string().trim().default(""),
  zapis: z.string().trim().default(""),
  jednatel: z.string().trim().default(""),
  jednatelFunkce: z.string().trim().default(""),
});

export const nastaveniRouter = {
  firma: base.handler(() => nactiFirmu()),
  ulozFirmu: base.input(firmaSchema).handler(({ input }) => ulozFirmu(input)),

  volby: base.handler(async () => ({
    zvraznitNevyplnene: await zvraznitNevyplnene(),
  })),
  ulozVolby: base
    .input(z.object({ zvraznitNevyplnene: z.boolean() }))
    .handler(async ({ input }) => {
      await uloz(KLICE.zvraznitNevyplnene, input.zvraznitNevyplnene ? "true" : "false");
      return { zvraznitNevyplnene: input.zvraznitNevyplnene };
    }),

  driveStav: base.handler(async () => {
    const stav = await stavPripojeni();
    return { ...stav, prihlasovaciCesta: "/api/drive/connect" };
  }),

  /** Složky na Disku pro výběr cílové složky; bez rodiče vrací i "Můj disk". */
  driveSlozky: base
    .input(z.object({ rodic: z.string().trim().optional() }).optional())
    .handler(async ({ input }) => {
      if (!(await stavPripojeni()).pripojeno) return { slozky: [], cesta: [] };
      const rodic = input?.rodic?.trim() || "root";
      const slozky = await seznamSlozek(rodic);
      return { slozky, cesta: rodic === "root" ? [] : [{ id: rodic, nazev: "…" }] };
    }),

  driveVybratSlozku: base
    .input(z.object({ id: z.string().trim(), nazev: z.string().trim().optional() }))
    .handler(async ({ input }) => {
      await ulozSlozku(input.id, input.nazev ?? "");
      return { slozkaId: input.id, slozkaNazev: input.nazev ?? "" };
    }),

  driveZrusitSlozku: base.handler(async () => {
    await Promise.all([smaz(KLICE.driveFolderId), smaz(KLICE.driveFolderNazev)]);
    return { ok: true };
  }),

  driveOdpojit: base.handler(async () => {
    await odpoj();
    return { ok: true };
  }),

  /** Co ještě chybí, aby šlo nahrávat na Disk. */
  driveDiagnostika: base.handler(async () => {
    return {
      maKonfiguraci: maKonfiguraci(),
      prehlasovaciUri: prehlasovaciUri(),
      chybi: [
        !process.env.GOOGLE_CLIENT_ID ? "GOOGLE_CLIENT_ID" : "",
        !process.env.GOOGLE_CLIENT_SECRET ? "GOOGLE_CLIENT_SECRET" : "",
        !prehlasovaciUri() ? "GOOGLE_REDIRECT_URI" : "",
      ].filter(Boolean),
    };
  }),
};
