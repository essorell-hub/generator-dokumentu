// Sestaví samostatný program pro Windows (a pro zkoušku i pro Linux).
// Použití: bun scripts/build-windows.ts [bun-windows-x64|bun-linux-x64] [výstupní soubor]
import { createRequire } from "node:module";
import path from "node:path";

const target = (process.argv[2] ?? "bun-windows-x64") as "bun-windows-x64" | "bun-linux-x64";
const outfile = process.argv[3] ?? "out/GeneratorDokumentu.exe";

const require = createRequire(path.resolve("packages/web/package.json"));
const libsqlWeb = require.resolve("@libsql/client/web");

const vysledek = await Bun.build({
  entrypoints: ["packages/web/src/windows-server.ts"],
  target: "bun",
  compile: { target, outfile },
  plugins: [
    {
      // Nativní část knihovny libsql se do programu pro Windows nedá zabalit.
      // Webová varianta funguje čistě přes internet, což přesně potřebujeme.
      name: "libsql-web",
      setup(build) {
        build.onResolve({ filter: /^@libsql\/client$/ }, () => ({ path: libsqlWeb }));
      },
    },
  ],
});

if (!vysledek.success) {
  for (const l of vysledek.logs) console.error(String(l));
  process.exit(1);
}
console.log("Hotovo:", outfile);
