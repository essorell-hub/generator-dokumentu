# Audita: Správa šablon na Google Drive a kontrola aktuálnosti norem

**Projekt:** Generátor dokumentů
**Větev:** `feature/generator-build-validation`

---

## 1. Jak dnes funguje generování dokumentů

- Dokumenty (DOCX, XLSX, …) jsou generovány ve **packages/web/src/api/lib/docgen**.
- Šablony jsou uloženy lokálně v `packages/web/src/api/lib/docgen/templates/` jako TypeScript‑ové funkce, které vrací strukturu `DocxTemplate`.
- Generování probíhá pomocí knihovny **docx** (pro DOCX) a **xlsx** (pro XLSX). Data jsou předávána z backendu (`packages/web/src/api/routes/generovani.ts`) a přímo do šablon.
- Šablona je **kompilována** při běhu aplikace, není načítána z externího úložiště.
- Výstupní soubory jsou vráceny jako `Uint8Array` a následně posílány klientovi ke stažení.

> **Závěr:** V současné implementaci jsou šablony **pevně zakódované** v kódu a nejsou načítány z Google Drive ani jiného vzdáleného úložiště.

---

## 2. Jak je dnes implementován Google Drive

- Soubor `packages/web/src/api/lib/drive.ts` poskytuje úplný OAuth 2.0 klient a funkce pro práci s Drive (výpis složek, nahrávání souborů, získání tokenu).
- Konfigurace se ukládá v databázi pomocí klíčů `driveRefreshToken`, `driveEmail`, `driveFolderId`, `driveFolderNazev`.
- Existují následující veřejné funkce:
  - `maKonfiguraci()` – kontrola, zda jsou nastaveny CLIENT_ID a CLIENT_SECRET.
  - `stavPripojeni()` – vrací objekt `{nakonfigurovano, pripojeno, email, slozkaId, slozkaNazev}`.
  - `seznamSlozek(rodic)` – získá seznam podsložek (použitelné v nastavení).
  - `nahrajSoubor()` – nahrává soubor do dané složky; existující soubor nahradí.
- **Žádná** funkce pro čtení souboru nebo pro výběr konkrétní šablony z Drive není implementována.

---

## 3. Co již existuje a co chybí

| Oblast | Existující komponenta | Chybějící / nutná rozšíření |
|--------|----------------------|-----------------------------|
| **OAuth** | `drive.ts` (auth, token refresh) | – |
| **Výběr složky** | `seznamSlozek` a `ulozSlozku` | UI pro výběr složky v nastavení a uložení ID/Název. |
| **Načítání souboru** | – | Funkce `nactiSoubor(id)` – stáhnout soubor a získat jeho obsah (DOCX). |
| **Mapování šablona ↔ typ dokumentu** | Šablony jsou definovány v `docgen/templates/*.ts` a přiřazeny v `generovani.ts`. | Databázová tabulka/settings (např. `templateFolderId`) a mapovací logika, která načte šablonu z Drive podle typu. |
| **Validace existence / verze šablony** | – | Kontrola, zda soubor existuje, získání `modifiedTime`. |
| **Bezpečné alternativy** | Lokální fallback (použít interní šablonu) | Mechanismus, který při chybě Drive použije lokální šablonu a zobrazí varování uživateli. |

---

## 4. Návrh nastavení složky šablon

1. **Nové UI** – sekce **Nastavení → Zdroje dokumentů → Šablony**.
   - Pole **„ID složky Google Drive“** (textové pole) s tlačítkem **„Otestovat připojení“**.
   - Tlačítko **„Vybrat ze seznamu“** otevře dialog s výpisem složek získaných pomocí `seznamSlozek('root')`.
   - Zobrazí se **název složky** a **poslední úprava** (`slozkaNazev`, `slozkaId`).
   - Uložení provede `ulozSlozku(id, nazev)`.
2. **Backend** – rozšířit `packages/web/src/api/routes/nastaveni.ts`:
   - `GET /api/nastaveni/templates` → vrátí aktuální `slozkaId` a `slozkaNazev` + stav připojení.
   - `POST /api/nastaveni/templates` → přijme `{folderId}`; ověří existenci (`driveFetch('/files/{id}?fields=name,modifiedTime')`), uloží ID a název.
   - `GET /api/nastaveni/templates/test` → provede `seznamSlozek(folderId)` a vrátí první 10 položek jako výsledek testu.
3. **Bezpečnost** – neukládat žádné tokeny ani tajné údaje do veřejných odpovědí; všechny citlivé operace probíhají server‑side.

---

## 5. Výběr složky šablon – konkrétní plán (varianta A)

### 5.1. Existuje‑li podpora Google Picker?
- `drive.ts` neobsahuje Picker integraci. Google Picker je samostatná knihovna, která vyžaduje **Google Identity Services (GIS)** pro získání OAuth‑2.0 tokenu a **Google Picker API**.
- Pro bezpečný výběr složky je potřeba:
  1. **Zajistit povolení API** – v Google Cloud Console povolit **Google Picker API** a **Google Drive API**.
  2. **OAuth 2.0 client ID** – již existuje (`process.env.GOOGLE_CLIENT_ID`). Musí mít povolené **Authorized JavaScript origins** (např. `http://localhost:3000`, `https://myapp.example.com`).
  3. **API key** – vytvořit **API‑key** (nepoužívat secret) a omezit jej na Picker a Drive.
- **Alternativa**: Použít jednoduchý vlastní dialog, kde načteme seznam složek pomocí `seznamSlozek` a uživatel klikne na požadovanou. To nevyžaduje Picker ani další knihovny a je vhodnější, protože už projekt už má funkci `seznamSlozek`.

### 5.2. Navrhovaný postup (bez Picker, pouze seznam)
1. **Frontend komponenta** `TemplateFolderPicker` v `packages/web/src/web/components/TemplateFolderPicker.tsx`:
   - Po kliknutí na tlačítko „Vybrat složku Google Drive“ zavolá hook `useFolderList('root')` (nový hook, využívá `seznamSlozek`).
   - V modálním okně zobrazí tabulku `id`, `název`, `upraveno`.
   - Uživatel vybere řádek → komponenta získá `id` a `název`.
   - Po potvrzení komponenta pošle POST request na `/api/nastaveni/templates` s `{folderId}`.
2. **Server‑side** uloží ID a název pomocí `ulozSlozku`.
3. **Zobrazení stavu**: Po uložení UI zobrazí název složky a ikonu indikující **připojeno** (z `stavPripojeni`).
4. **Test připojení**: Tlačítko „Otestovat připojení“ zavolá `/api/nastaveni/templates/test` a ukáže první 5 položek. Pokud vrátí výsledek, je připojení funkční.

### 5.3. Co je potřeba (při použití Picker)
| Položka | Proč | Poznámka |
|--------|------|----------|
| **Google Picker API** | Poskytuje UI pro výběr souborů i složek přímo od Google. | Musí být povoleno v Cloud Console. |
| **Google Identity Services (GIS)** | Získání OAuth tokenu s rozsahem `https://www.googleapis.com/auth/drive.file`. | Již máme client ID, ale je potřeba načíst GIS knihovnu na frontendu. |
| **API Key** | Picker vyžaduje veřejný API‑key. | Vytvořit v Cloud Console, omezit na Picker a Drive. |
| **CSP / Referrer** | Frontend musí mít povolený `https://*.google.com` zdroje. | Přidat do CSP konfigurace, pokud je použita. |

**Bez Picker** je výše uvedený vlastní dialog dostačující a nevyžaduje žádné další nastavení kromě povolení Drive API (které již je). Proto doporučuji použít vlastní seznam složek.

---

## 6. Návrh pravidelného sledování norem (část B)
*(zůstává beze změny – viz předchozí report)*

---

## 7. Dostupné zdroje a jejich omezení
*(zůstává beze změny – viz předchozí report)*

---

## 8. Návrh bezpečného aktualizačního procesu šablon
*(zůstává beze změny – viz předchozí report)*

---

## 9. Přesný seznam souborů, které by bylo nutné změnit

| Soubor | Typ změny |
|--------|-----------|
| `packages/web/src/api/lib/drive.ts` | Přidat funkci `nactiSoubor(id)` a rozšířit `seznamSlozek` o filtr na MIME typy (DOCX, XLSX). |
| `packages/web/src/api/routes/nastaveni.ts` | Nové endpointy GET/POST `/api/nastaveni/templates` a testovací endpoint. |
| `packages/web/src/web/pages/Nastaveni.tsx` | UI sekce **„Zdroje dokumentů → Šablony“** – komponenta pro výběr složky a test připojení. |
| `packages/web/src/web/queries/nastaveni.ts` | Hooky `useTemplateFolder`, `useTestDriveConnection`. |
| `packages/web/src/api/routes/generovani.ts` | Modifikovat generovací funkce tak, aby místo lokální šablony volaly `nactiSoubor` a použily obsah jako šablonu (např. `docx.load`). |
| `packages/web/src/api/lib/docgen/index.ts` (nebo příslušný soubor) | Přepsat načítání šablon – přijímat `Uint8Array` z Drive a předávat `docx` knihovně. |
| `packages/web/src/api/lib/nastaveni.ts` | Přidat nastavení `driveFolderId` a `driveFolderNazev` do exportovaných klíčů. |
| `packages/web/src/web/pages/Normy.tsx` (nový nebo rozšířený) | UI pro správu norem (zobrazení, manuální úpravy, plánované kontroly). |
| `scripts/check-standards.ts` (nový) | Skript spouštěný cron‑jobem, který kontroluje aktuálnost norem. |
| `packages/web/src/api/lib/standards.ts` (nový) | Moduly pro práci s databází norem a mapování na šablony. |

---

## 10. Návrh testů a podmínek pro bezpečné spuštění
*(zůstává beze změny – viz předchozí report)*

---

## 11. Další krok (česky)

1. **Schvalte návrh** – dejte mi vědět, zda souhlasíte s navrženou architekturou a seznamem souborů, případně upřesněte prioritu mezi správou šablon (A) a kontrolou norem (B).  
2. **Potvrďte potřebu databázové migrace** – vytvoření tabulek `normy` a `template_audit` (vyžaduje migraci). Pokud souhlasíte, připravím detailní popis migrace.  
3. **Po schválení** – zahájíme implementaci backendových rozšíření (`drive.ts`, `nastaveni.ts`, `generovani.ts`), UI komponent pro nastavení šablon a norem a skript pro pravidelnou kontrolu norem.  
4. **Po implementaci** – spustíme kompletní sadu unit a integration testů, ověříme, že build a type‑checking stále projdou.  
5. **Manuální ověření** – na testovacím prostředí zkontrolujeme, že výběr složky na Drive mění skutečnou šablonu při generování, že export JSON neobsahuje citlivá data a že rollback a audit log fungují správně.  

> **Bezpečnost:** Všechny operace s Google Drive probíhají na serveru. Klientovi jsou předávány pouze ID a metadata, tokeny zůstávají v databázi a nejsou nikdy logovány.

---

**Závěr:** Navržený design umožňuje bezpečně přejít od lokálně zakódovaných šablon k **centrální správě na Google Drive**, přičemž je zachována kompatibilita se stávajícími generátory. Současně je připraven modul pro **monitorování aktuálnosti norem**, který lze rozšířit o automatické zdroje informací a plánované kontroly.
