import { base } from "../__core/app";
import { z } from "zod";
import { seznamSouboru, stavPripojeni } from "../lib/drive";

/**
 * Endpoint – vrací metadata souborů v zadané složce Google Drive.
 * Pouze čtení – neprovádí žádné zápisy ani mazání.
 */
export const driveFilesRouter = {
  /**
   * List files in a folder (read‑only).
   * Vstup: { folderId: string }
   * Výstup: { files: Array<{ id: string; nazev: string; mimeType: string; upraveno: string }> }
   */
  soubory: base
    .input(z.object({ folderId: z.string().trim() }))
    .handler(async ({ input }) => {
      // Ověření, že je Drive připojený
      if (!(await stavPripojeni()).pripojeno) {
        // vrátíme chybu – router zachytí a pošle 400
        throw new Error("Google Drive není připojen");
      }
      // Načteme soubory – funkce sama hází DriveChyba při selhání API
      const files = await seznamSouboru(input.folderId);
      return { files };
    }),
};
