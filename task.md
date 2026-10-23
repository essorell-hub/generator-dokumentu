# Úkol: Rešerše „co je třeba vytvořit" (obor elektro) + doplnění do aplikace

Zdroj zadání: uživatel chce kompletní profesní rešerši činnosti kanceláře (obor **elektro**)
a rovnou ji zapracovat do aplikace Generátor dokumentů.

## Zjištěný právní rámec (ověřeno z primárních zdrojů)

- **Zákon č. 250/2021 Sb.** o bezpečnosti práce v souvislosti s provozem vyhrazených technických zařízení
- **NV č. 190/2022 Sb.** — vyhrazená elektrická zařízení (VEZ), třídy I/II, přílohy 1–5
- **NV č. 194/2022 Sb.** — odborná způsobilost (osoba poučená, elektrotechnik, vedoucí elektrotechnik, revizní technik)
- **NV č. 60/2022 Sb.** — poplatky pověřené organizace (TIČR)
- **Vyhláška č. 114/2023 Sb.** — bezpečná instalace výrobny OZE do 50 kW
- Živnost vázaná: Montáž, opravy, údržba a revize vyhrazených elektrických zařízení
- Normy: ČSN 33 2000-6 ed. 2, ČSN 33 1500, ČSN 33 2000-7-712 ed. 2, ČSN EN 62446-1 +A1,
  ČSN EN IEC 62305-1..4, ČSN 33 1600 ed. 2, ČSN 33 2000-5-51 ed. 3

## Klíčové lhůty (ověřeno)

| Co | Lhůta | Zdroj |
|---|---|---|
| Pravidelná revize — administrativa | 5 let | NV 190 příloha 4 |
| Revize — výroba, školy, ubytování, lékařské | 3 roky | NV 190 příloha 4 |
| Revize — objekt pro >200 osob | 2 roky | NV 190 příloha 4 |
| Revize — staveniště | 0,5 roku | NV 190 příloha 4 |
| Revize — pojízdné a převozné prostředky | 1 rok | NV 190 příloha 4 |
| Revize — prostory s nebezpečím požáru a výbuchu | 3 roky | NV 190 příloha 4 |
| Revize — mokré / korozivní prostory | 1 rok | NV 190 příloha 4 |
| LPS — kritické systémy | 2 roky | NV 190 příloha 4 |
| LPS — ostatní objekty | 4 roky | NV 190 příloha 4 |
| LPS vizuální kontrola | 1 rok (výbušné 6 měsíců) | NV 190 příloha 4 |
| Osvědčení revizního technika | 5 let | TIČR |
| Doklad o odborné způsobilosti (elektrotechnik, ved. elektrotechnik) | 3 roky | NV 194 |
| Oprávnění právnické/podnikající FY osoby | 10 let | zákon 250/2021 §8 |
| Zdravotní způsobilost — periodická prohlídka | 6 let (50+ nebo riziko 4 roky) | vyhl. 79/2013 |
| Školení elektrotechniků | min. 1× ročně | NV 194 §3/4 |
| Protokol o zkoušce z OZ — uchování | 6–7 let | NV 194 §9/4/c |
| Revize el. spotřebičů a ručního nářadí | 3 měsíce – 2 roky | ČSN 33 1600 ed. 2 tab. 1 |
| Výchozí revizní zpráva — uložení | trvale, do zrušení zařízení | ČSN 33 1500 |

## Co v aplikaci chybělo (mezera) a bylo doplněno

### Evidence (databáze + UI + XLSX)
- `meridla` — měřidla a kalibrace (povinný soupis v revizní zprávě, §10/1/g NV 190)
- `osoby` — odborná způsobilost, osvědčení, školení, zdravotní prohlídky
- `opravneni` — oprávnění firmy (TIČR, 10 let)
- `prohlidky` — revizní kniha / provozní deník (§7/5/c NV 190)

### Generované dokumenty (DOCX přes knihovnu `docx`)
Řád prohlídek údržby a revizí · Pověření odpovědné osoby · Vyhodnocení elektrického rizika ·
Stanovení vedoucího práce · Zápis o seznámení s OOPP · Zápis o poučení a ověření znalostí ·
Souhrnná zpráva o výchozí revizi · Žádost o osvědčení VEZ I. třídy · Protokol o zkoušce z OZ ·
Doklad o úspěšném složení zkoušky z OZ · Potvrzení o školení a ověření znalostí ·
Doklad o nahrazení odborné kvalifikace · Zpráva o revizi elektrických spotřebičů a ručního nářadí

## Postup
1. [x] Rešerše primárních zdrojů (NV 190 text + přílohy 1–5, NV 194, TIČR, příloha 4 lhůty)
2. [ ] Schéma DB + db:push
3. [ ] API routes/provoz.ts
4. [ ] XLSX exporty
5. [ ] DOCX generátory nových dokumentů
6. [ ] UI stránky /provoz, /kniha + zařazení do katalogu dokumentů
7. [ ] Typecheck + build + vizuální kontrola
8. [ ] Report (rešerše) + deliver

## Ověřeno
- `docx@9.9.0` nainstalováno, generuje DOCX s diakritikou i tabulkami (test /tmp/tdocx.ts → 9886 B, 1 stránka)