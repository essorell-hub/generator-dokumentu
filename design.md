# Generátor dokumentů — Design

Interní webová aplikace pro kancelář LOSKOT HOZÁKOVÁ. Slouží k jedné věci: zadat zakázku, vybrat dokumenty a vygenerovat je rovnou do složky zakázky na Google Drive. Jen web, bez přihlašování.

Vizuální směr vychází z reference **Makeshift** — plochá editorial stránka: bílá, hodně vzduchu, centrované sekce oddělené tenkými linkami, cihlové a terakotové akcenty, mozaikový barevný pruh. Žádné zaoblené karty se stíny.

## Barvy

Jediná sada tokenů, čte se z `packages/web/src/web/styles.css`.

| Token | Hex | Použití |
|-------|-----|---------|
| `--brick` | `#B04A2F` | Primární akcent, tlačítka, aktivní stav, nadpisy sekcí |
| `--brick-deep` | `#7E3220` | Hover, nadpisy H1, silné akcenty |
| `--brick-wash` | `#F7F1EC` | Podbarvení řádků tabulek, jemné plochy |
| `--note-wash` | `#FBF3EE` | Poznámkové bloky |
| `--ink` | `#2B2724` | Hlavní text |
| `--ink-soft` | `#6E6A66` | Sekundární text, popisky |
| `--paper` | `#FFFFFF` | Podklad stránky |
| `--line` | `#E3DCD5` | Linky, oddělovače, rámečky |
| `--moss` | `#646247` | Stav „vygenerováno“, kladné hodnoty |
| `--amber` | `#D89E57` | Stav „rozpracováno“, upozornění |
| `--clay` | `#CA6F44` | Doplněk mozaiky, označení výběru |
| `--charcoal` | `#3A3638` | Tmavá plocha patičky |
| `--alert` | `#A33528` | Chyba, neúspěšné generování |

**Mozaikový pruh** — osmibarevný pás z výše uvedených tónů (`brick`, `brick-deep`, `clay`, `amber`, `moss`, `charcoal`, `#9D8F64`, `#A86E5C`) jako hlavička aplikace a jako oddělovač velkých sekcí. Je to podpis reference, používá se dvakrát, ne víc.

## Typografie

- **Calibri** pro všechno — je firemní písmo a stejné jako v generovaných dokumentech. Self-hosted soubor patří do `packages/web/public/fonts/`; fallback `system-ui`.
- **Nadpisy sekcí** verzálkami, prostrkání `0.18em`, velikost 12–13 px, `--brick`. Vypadají jako popisky v referenci (`PRODUCTS`, `TEAM`, `WORK WITH US`).
- **H1 stránky** 28–34 px, `--brick-deep`, normální váha.
- **Tělo** 15 px, řádkování 1.6, `--ink`.
- **Čísla zakázek a kódy** v monospace (`ui-monospace, SFMono-Regular, Menlo`), `--ink-soft`, mírné prostrkání — jako pruh `MAKESHIFT` v referenci.
- **Popisky formulářů** 11 px, verzálky, prostrkání `0.08em`, `--ink-soft`.

## Layout

- Maximální šířka obsahu **1080 px**, vycentrováno, vnější okraje 24 px.
- Sekce oddělené **1 px linkou** přes celou šířku obsahu, ne rámečky a karty.
- Nadpisy sekcí **vycentrované**, obsah pod nimi zarovnaný vlevo — stejně jako v referenci.
- Formuláře dvousloupcové (grid 2×), na mobilu jednosloupcové.
- Tabulky bez rámečků, jen spodní linky a střídavé podbarvení `--brick-wash`.
- Tlačítka hranatá (`border-radius: 2px`), plná cihlová primární, obrysová sekundární.
- **Žádné zaoblené karty, žádné stíny, žádné gradienty.** Hierarchie jen linkami, podbarvením a velikostí.

## Obrazovky

- **Zakázky** (`src/web/pages/Zakazky.tsx`) — seznam zakázek, hledání podle čísla a názvu, filtr stavu, tlačítko *Nová zakázka*. Každý řádek: číslo (mono), název stavby, investor, stav, datum.
- **Detail zakázky** (`src/web/pages/ZakazkaDetail.tsx`) — dva bloky: *Údaje zakázky* (formulář) a *Generátor* (checklist 8 dokumentů, kontrola nevyplněných míst, tlačítko Vygenerovat, historie generování s odkazy na Drive).
- **Nastavení** (`src/web/pages/Nastaveni.tsx`) — údaje firmy, připojení Google Drive (stav, tlačítko připojit, cílová složka), volby generování (zvýraznit nevyplněná místa).

## Klíčové toky

1. **Nová zakázka** — Zakázky → Nová zakázka → vyplnit číslo, stavbu, investora → Uložit → Detail.
2. **Generování** — Detail → zkontrolovat vyplnění (žlutě zvýrazněná místa v náhledu) → zaškrtnout dokumenty → Vygenerovat → soubory se nahrají do `ZAKÁZKY/<číslo> – <název>` na Disku → historie zobrazí odkazy.
3. **Připojení Drive** — Nastavení → Připojit Google Drive → přihlášení účtem kanceláře → vybrat cílovou složku → token se uloží.
4. **Prázdný stav** — žádná zakázka: vycentrovaná výzva s mozaikovým pruhem, ne prázdná tabulka.

## Architektura

- **API**: typovaný oRPC klient (`src/web/lib/api.ts`) → backend v `@template/web`, procedury v `src/api/routes/`.
- **Generování dokumentů**: `src/api/lib/docgen/` — schválené šablony `rev-02-2026` jsou vložené jako base64, engine přepíše placeholdery v `word/document.xml` a vrátí DOCX. Běží v Hono, bez Pythonu.
- **Drive**: `src/api/lib/drive.ts` — OAuth 2.0 klient kanceláře, refresh token v databázi, nahrávání přes Drive REST API.
- **Data**: Drizzle + Turso. Tabulky `zakazky`, `dokumenty`, `nastaveni`.
- **Stav**: TanStack Query, invalidace `orpc.zakazky.key()` po zápisu.
