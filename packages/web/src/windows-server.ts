// Spouštěč pro Windows (offline program). Nepatří do šablony Runable.
// Načte nastavení ze souboru .env vedle programu, připraví databázi,
// spustí server a otevře aplikaci v prohlížeči.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const baseDir = process.env.GD_HOME ?? path.dirname(process.execPath);
const port = Number(process.env.PORT ?? 3217);
const url = `http://localhost:${port}`;

async function cekejNaEnter(): Promise<void> {
  console.log("\nStiskněte Enter pro zavření okna.");
  await new Promise<void>((resolve) => process.stdin.once("data", () => resolve()));
}

async function konec(zprava: string): Promise<never> {
  console.error(`\nCHYBA: ${zprava}`);
  await cekejNaEnter();
  process.exit(1);
}

function nactiEnv(soubor: string): void {
  const text = readFileSync(soubor, "utf8");
  for (const radek of text.split(/\r?\n/)) {
    const r = radek.trim();
    if (!r || r.startsWith("#")) continue;
    const i = r.indexOf("=");
    if (i < 1) continue;
    const klic = r.slice(0, i).trim();
    let hodnota = r.slice(i + 1).trim();
    if (
      (hodnota.startsWith('"') && hodnota.endsWith('"')) ||
      (hodnota.startsWith("'") && hodnota.endsWith("'"))
    ) {
      hodnota = hodnota.slice(1, -1);
    }
    if (process.env[klic] === undefined) process.env[klic] = hodnota;
  }
}

function otevriProhlizec(): void {
  if (process.platform !== "win32" || process.env.GD_NO_BROWSER) return;
  try {
    spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
  } catch {
    /* prohlížeč se nepodařilo otevřít – uživatel může otevřít adresu ručně */
  }
}

console.log("Generátor dokumentů – spouštím…");

// Nastavení se hledá v souboru nastaveni.txt (nejjednodušší úprava v Poznámkovém bloku),
// případně nastaveni.env nebo .env.
const envSoubor = ["nastaveni.txt", "nastaveni.env", ".env"]
  .map((n) => path.join(baseDir, n))
  .find((c) => existsSync(c));
if (!envSoubor) {
  await konec(
    `Nenalezen soubor nastaveni.txt ve složce ${baseDir}\nVedle programu musí ležet soubor nastaveni.txt s údaji k databázi.`,
  );
} else {
  nactiEnv(envSoubor);
}
process.env.WEBSITE_URL ||= url;

if (
  !process.env.DATABASE_URL ||
  !process.env.DATABASE_AUTH_TOKEN ||
  process.env.DATABASE_AUTH_TOKEN.startsWith("SEM_VLOZTE")
) {
  await konec("V souboru nastaveni.txt chybí adresa databáze nebo přístupový klíč (viz NAVOD.txt).");
}

const distDir = path.join(baseDir, "dist");
if (!existsSync(path.join(distDir, "index.html"))) {
  await konec(`Nenalezena složka dist s rozhraním aplikace ve složce ${baseDir}`);
}

try {
  if (process.env.GD_SKIP_MIGRATE) throw new Error("__PRESKOCENO__");
  const { db } = await import("./api/database");
  const { migrate } = await import("drizzle-orm/libsql/migrator");
  console.log("Připravuji databázi…");
  await migrate(db, { migrationsFolder: path.join(baseDir, "drizzle") });
} catch (e) {
  if (e instanceof Error && e.message === "__PRESKOCENO__") {
    console.log("(zkouška: příprava databáze přeskočena)");
  } else
  await konec(
    `Nepodařilo se připojit k databázi nebo ji připravit (zkontrolujte internet a údaje v nastaveni.txt).\n${e instanceof Error ? (e.cause instanceof Error ? e.cause.message : e.message) : String(e)}`,
  );
}

const { default: app } = await import("./api");

function cestaKSouboru(pathname: string): string | null {
  const ciste = decodeURIComponent(pathname).replace(/^\/+/, "");
  const plna = path.resolve(distDir, ciste || "index.html");
  return plna.startsWith(path.resolve(distDir)) ? plna : null;
}

try {
  Bun.serve({
    port,
    async fetch(request) {
      const u = new URL(request.url);
      if (u.pathname.startsWith("/api")) return app.fetch(request);
      const cesta = cestaKSouboru(u.pathname);
      if (cesta) {
        const soubor = Bun.file(cesta);
        if (await soubor.exists()) return new Response(soubor);
      }
      return new Response(Bun.file(path.join(distDir, "index.html")), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    },
  });
} catch (e) {
  const zprava = e instanceof Error ? e.message : String(e);
  if (/EADDRINUSE|in use/i.test(zprava)) {
    console.log("Program už běží, otevírám ho v prohlížeči.");
    otevriProhlizec();
    process.exit(0);
  }
  await konec(zprava);
}

try {
  const { spustAutomatickouZalohu } = await import("./api/lib/zaloha");
  spustAutomatickouZalohu();
} catch {
  /* automatická záloha je jen pomocná funkce, program běží i bez ní */
}

console.log(`\nAplikace běží na adrese ${url}`);
console.log("Toto okno nezavírejte, dokud s aplikací pracujete.");
otevriProhlizec();
