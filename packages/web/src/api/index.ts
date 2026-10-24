import { zipSync } from "fflate";
import { createApp } from "./__core/app";
import { ping } from "./routes/ping";
import { zakazkyRouter } from "./routes/zakazky";
import { generovaniRouter } from "./routes/generovani";
import { nastaveniRouter } from "./routes/nastaveni";
import {
  mailyRouter,
  normyRouter,
  rejstrikRouter,
  revizeRouter,
} from "./routes/agenda";
import { provozRouter } from "./routes/provoz";
import { prehledRouter } from "./routes/prehled";
import { zalohaRouter } from "./routes/zaloha";
import { vytvorZalohu } from "./lib/zaloha";
import { nazevProvozSouboru, provozXlsx } from "./lib/provozXlsx";
import { autorizacniUrl, dokonciPrihlaseni, maKonfiguraci } from "./lib/drive";
import { sestavSadu, vyberKlice } from "./lib/sada";
import {
  evidenceXlsx,
  nazevEvidenceSouboru,
  nazevNormySouboru,
  normyXlsx,
} from "./lib/agenda/xlsx";

export const router = {
  ping,
  zakazky: zakazkyRouter,
  generovani: generovaniRouter,
  nastaveni: nastaveniRouter,
  rejstrik: rejstrikRouter,
  revize: revizeRouter,
  normy: normyRouter,
  maily: mailyRouter,
  provoz: provozRouter,
  prehled: prehledRouter,
  zaloha: zalohaRouter,
};

export type AppRouter = typeof router;
/** Typed client for the router — used by the web and mobile api clients. */
export type AppRouterClient = RouterClient<AppRouter>;

import type { RouterClient } from "@orpc/server";

const app = createApp(router);

// ------------------------------------------------------------- Google Drive

app.get("/api/drive/connect", (c) => {
  if (!maKonfiguraci()) {
    return c.redirect("/nastaveni?drive=chybi", 302);
  }
  const stav = String(Date.now());
  return c.redirect(autorizacniUrl(stav), 302);
});

app.get("/api/drive/callback", async (c) => {
  const kod = c.req.query("code");
  const chyba = c.req.query("error");
  if (chyba) return c.redirect(`/nastaveni?drive=odmitnuto`, 302);
  if (!kod) return c.redirect(`/nastaveni?drive=chyba`, 302);
  try {
    await dokonciPrihlaseni(kod);
    return c.redirect(`/nastaveni?drive=ok`, 302);
  } catch {
    return c.redirect(`/nastaveni?drive=chyba`, 302);
  }
});

// ------------------------------------------------------- stahování souborů

async function odpovedSeSouborom(
  zakazkaId: number,
  klice: string[] | undefined,
): Promise<{ soubory: { nazevSouboru: string; data: Uint8Array }[]; nazev: string }> {
  const sada = await sestavSadu(zakazkaId, klice);
  return {
    soubory: sada.soubory.map((s) => ({ nazevSouboru: s.nazevSouboru, data: s.data })),
    nazev: sada.zakazka.cislo || `zakazka-${zakazkaId}`,
  };
}

app.get("/api/soubory/docx", async (c) => {
  const zakazkaId = Number(c.req.query("zakazkaId"));
  const klic = c.req.query("klic") ?? "";
  if (!zakazkaId || !klic) return c.text("Chybí zakazkaId nebo klic", 400);
  const { soubory } = await odpovedSeSouborom(zakazkaId, [klic]);
  if (!soubory.length) return c.text("Dokument nenalezen", 404);
  const soubor = soubory[0];
  return new Response(soubor.data as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(soubor.nazevSouboru)}`,
    },
  });
});

// ------------------------------------------------- exporty agendy do XLSX

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function odpovedXlsx(data: Uint8Array, nazev: string): Response {
  return new Response(data as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": XLSX_MIME,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(nazev)}`,
    },
  });
}

app.get("/api/soubory/zaloha.json", async () => {
  const zaloha = await vytvorZalohu();
  return new Response(zaloha.data as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(zaloha.nazev)}`,
    },
  });
});

app.get("/api/soubory/evidence.xlsx", async () => {
  return odpovedXlsx(await evidenceXlsx(), nazevEvidenceSouboru());
});

app.get("/api/soubory/normy.xlsx", async () => {
  return odpovedXlsx(await normyXlsx(), nazevNormySouboru());
});

app.get("/api/soubory/provoz.xlsx", async () => {
  return odpovedXlsx(await provozXlsx(), nazevProvozSouboru());
});

app.get("/api/soubory/zip", async (c) => {
  const zakazkaId = Number(c.req.query("zakazkaId"));
  const kliceParam = c.req.query("klice");
  const klice = kliceParam ? kliceParam.split(",").map((k) => k.trim()).filter(Boolean) : undefined;
  if (!zakazkaId) return c.text("Chybí zakazkaId", 400);
  const { soubory, nazev } = await odpovedSeSouborom(zakazkaId, vyberKlice(klice));
  if (!soubory.length) return c.text("Není co zabalit", 404);
  const vstup: Record<string, Uint8Array> = {};
  for (const s of soubory) vstup[s.nazevSouboru] = s.data;
  const zip = zipSync(vstup, { level: 6 });
  return new Response(zip as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`${nazev}_dokumentace.zip`)}`,
    },
  });
});

export default app;
