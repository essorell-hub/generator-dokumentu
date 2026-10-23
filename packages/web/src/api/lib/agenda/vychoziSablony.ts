/**
 * Výchozí sada e-mailových šablon.
 *
 * Zástupné znaky se ve tvaru {{nazev}} nahrazují daty z vybrané zakázky.
 * Dostupné znaky vypisuje `DOSTUPNE_ZNACKY` v lib/agenda/maily.ts.
 */

export type VychoziSablona = {
  nazev: string;
  kategorie: string;
  predmet: string;
  telo: string;
  poradi: number;
};

export const VYCHOZI_SABLONY: VychoziSablona[] = [
  {
    nazev: "Poptávka – potvrzení přijetí",
    kategorie: "Poptávka",
    poradi: 1,
    predmet: "Potvrzení přijetí poptávky – {{nazev}}",
    telo: `Dobrý den,

děkujeme za poptávku k zakázce {{nazev}} ({{adresa}}).

Poptávku jsme zaevidovali pod číslem {{cislo}}. Ozveme se vám s upřesněním rozsahu a s cenovou nabídkou nejpozději do {{termin}}.

Pokud by se v mezidobě změnil rozsah nebo termín, dejte nám prosím vědět.

S pozdravem

{{zpracovatel}}
{{firma}}
{{firmaKontakt}}`,
  },
  {
    nazev: "Nabídka – odeslání cenové nabídky",
    kategorie: "Nabídka",
    poradi: 2,
    predmet: "Cenová nabídka {{cislo}} – {{nazev}}",
    telo: `Dobrý den,

v příloze zasíláme cenovou nabídku k zakázce {{nazev}} ({{adresa}}).

Rozsah: {{typ}}
Cena bez DPH: {{cena}} Kč
Platnost nabídky: 30 dnů od odeslání

Nabídka vychází z dokumentace, kterou jsme od vás obdrželi. Pokud se změní rozsah nebo podklady, rádi ji upravíme.

S pozdravem

{{zpracovatel}}
{{firma}}
{{firmaKontakt}}`,
  },
  {
    nazev: "Projekt – žádost o chybějící podklady",
    kategorie: "Projekt",
    poradi: 3,
    predmet: "Žádost o podklady – {{cislo}} {{nazev}}",
    telo: `Dobrý den,

při zpracování dokumentace k zakázce {{nazev}} ({{adresa}}) jsme narazili na chybějící podklady.

Prosíme o doplnění:
   · 
   · 

Bez těchto podkladů není možné dokumentaci dokončit v termínu {{termin}}. Jakmile je obdržíme, pokračujeme bez zdržení.

Děkujeme

{{zpracovatel}}
{{firma}}`,
  },
  {
    nazev: "Předání – dokumentace ke kontrole",
    kategorie: "Předání",
    poradi: 4,
    predmet: "Předání dokumentace {{cislo}} – {{nazev}}",
    telo: `Dobrý den,

předáváme vám dokumentaci k zakázce {{nazev}} ({{adresa}}).

Předané dokumenty:
{{dokumenty}}

Složka zakázky: {{slozka}}

Prosíme o kontrolu a případné připomínky do 14 dnů. Poté považujeme dokumentaci za odsouhlasenou a předanou.

S pozdravem

{{zpracovatel}}
{{firma}}
{{firmaKontakt}}`,
  },
  {
    nazev: "Fakturace – odeslání faktury",
    kategorie: "Fakturace",
    poradi: 5,
    predmet: "Faktura {{cisloFaktury}} – {{nazev}}",
    telo: `Dobrý den,

v příloze zasíláme fakturu č. {{cisloFaktury}} k zakázce {{cislo}} – {{nazev}}.

Částka bez DPH: {{cena}} Kč
Splatnost: 14 dnů od vystavení

Pokud jde o platbu na jiný účet nebo potřebujete jiné náležitosti, dejte nám prosím vědět.

S pozdravem

{{zpracovatel}}
{{firma}}`,
  },
  {
    nazev: "Fakturace – upomínka úhrady",
    kategorie: "Fakturace",
    poradi: 6,
    predmet: "Upomínka úhrady – faktura {{cisloFaktury}}",
    telo: `Dobrý den,

dovolujeme si připomenout, že faktura č. {{cisloFaktury}} k zakázce {{cislo}} – {{nazev}} ze dne {{datum}} nebyla dosud uhrazena.

Prosíme o kontrolu, případně o informaci, zda je platba na cestě.

Děkujeme

{{zpracovatel}}
{{firma}}`,
  },
  {
    nazev: "Revize – blíží se zákonná lhůta",
    kategorie: "Revize",
    poradi: 7,
    predmet: "Blíží se termín pravidelné revize – {{nazev}}",
    telo: `Dobrý den,

u objektu {{adresa}} se blíží zákonná lhůta pravidelné revize elektrického zařízení podle přílohy č. 4 nařízení vlády č. 190/2022 Sb.

Poslední revize: {{datum}}
Další revize: {{termin}}

Rádi pro vás revizi zajistíme včetně protokolu a evidence v rejstříku. Navrhněte prosím termín, který vám vyhovuje.

S pozdravem

{{zpracovatel}}
{{firma}}
{{firmaKontakt}}`,
  },
  {
    nazev: "Normy – upozornění na změnu normy",
    kategorie: "Normy",
    poradi: 8,
    predmet: "Změna v rejstříku norem – dotčeno zakázky",
    telo: `Dobrý den,

v rejstříku použitých norem jsme zjistili změnu:

Norma: 
Zapsaná edice: 
Zjištěná edice: 
Dotčené šablony: 

U zakázek, které se touto normou řídily, doporučujeme ověřit, zda dokumentace odpovídá aktuální edici. Ozvěte se, pokud potřebujete posouzení rozsahu.

{{zpracovatel}}
{{firma}}`,
  },
];