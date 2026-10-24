import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Check, Field, TextInput, Tlacitko } from "../components/fields";
import { Hr, PageTitle, SectionTitle } from "../components/layout";
import { formatDatumCas } from "../lib/format";
import { ZalohySekce } from "../components/zaloha";
import {
  useDriveDiagnostika,
  useDriveOdpojit,
  useDriveSlozky,
  useDriveStav,
  useFirma,
  useUlozFirmu,
  useUlozVolby,
  useVolby,
  useVybratSlozku,
  useZrusitSlozku,
} from "../queries/nastaveni";

type FirmaFormular = {
  nazev: string;
  adresa: string;
  ico: string;
  dic: string;
  email: string;
  telefon: string;
  web: string;
  ucet: string;
  zapis: string;
  jednatel: string;
  jednatelFunkce: string;
};

const PRAZDNA_FIRMA: FirmaFormular = {
  nazev: "",
  adresa: "",
  ico: "",
  dic: "",
  email: "",
  telefon: "",
  web: "",
  ucet: "",
  zapis: "",
  jednatel: "",
  jednatelFunkce: "",
};

const ZPRAVY_DRIVE: Record<string, { text: string; chyba: boolean }> = {
  ok: { text: "Google Drive je připojen.", chyba: false },
  chyba: { text: "Přihlášení k Google Drive se nepodařilo dokončit. Zkuste to znovu.", chyba: true },
  odmitnuto: { text: "Přístup k Google Drive byl zamítnut.", chyba: true },
  chybi: {
    text: "Chybí přihlašovací údaje (GOOGLE_CLIENT_ID a GOOGLE_CLIENT_SECRET) — připojení teď nelze spustit.",
    chyba: true,
  },
};

export default function Nastaveni() {
  const hledani = useSearch();
  const [, naviguj] = useLocation();

  const firma = useFirma();
  const ulozFirmu = useUlozFirmu();
  const volby = useVolby();
  const ulozVolby = useUlozVolby();

  const [form, setForm] = useState<FirmaFormular>(PRAZDNA_FIRMA);
  const [zmeneno, setZmeneno] = useState(false);

  useEffect(() => {
    if (!firma.data) return;
    const zdroj = firma.data as unknown as Record<string, unknown>;
    const novy = { ...PRAZDNA_FIRMA };
    for (const klic of Object.keys(PRAZDNA_FIRMA) as (keyof FirmaFormular)[]) {
      const hodnota = zdroj[klic];
      if (typeof hodnota === "string") novy[klic] = hodnota;
    }
    setForm(novy);
    setZmeneno(false);
  }, [firma.data]);

  const nastav = (klic: keyof FirmaFormular, hodnota: string) => {
    setForm((f) => ({ ...f, [klic]: hodnota }));
    setZmeneno(true);
  };

  const stavDrive = new URLSearchParams(hledani).get("drive");
  const zprava = stavDrive ? ZPRAVY_DRIVE[stavDrive] : undefined;

  useEffect(() => {
    if (stavDrive) naviguj("/nastaveni", { replace: true });
  }, [stavDrive, naviguj]);

  return (
    <>
      <PageTitle podtitul="Údaje kanceláře, připojení k Google Drive a cílová složka pro dokumenty. Nastavení platí pro všechny zakázky.">
        Nastavení
      </PageTitle>

      {zprava ? (
        <div
          className={
            zprava.chyba
              ? "mb-8 border border-alert/40 bg-note-wash px-5 py-4 text-[14px] text-alert"
              : "mb-8 border border-moss/40 bg-note-wash px-5 py-4 text-[14px] text-moss"
          }
        >
          {zprava.text}
        </div>
      ) : null}

      <DriveSekce />

      <Hr />

      <ZalohySekce />

      <Hr />

      <section>
        <SectionTitle hint="Údaje se propisují do hlaviček a podpisových bloků dokumentů — název, sídlo, IČO, DIČ, zápis v rejstříku, jednatel.">
          Údaje kanceláře
        </SectionTitle>

        {firma.isLoading ? (
          <p className="text-ink-soft">Načítám…</p>
        ) : (
          <>
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <Field label="Název kanceláře" className="sm:col-span-2">
                <TextInput
                  value={form.nazev}
                  onChange={(e) => nastav("nazev", e.target.value)}
                  placeholder="LOSKOT HOZÁKOVÁ s.r.o."
                />
              </Field>
              <Field label="Sídlo / adresa" className="sm:col-span-2">
                <TextInput
                  value={form.adresa}
                  onChange={(e) => nastav("adresa", e.target.value)}
                  placeholder="Ulice 123, 739 11 Frýdlant nad Ostravicí"
                />
              </Field>
              <Field label="IČO">
                <TextInput value={form.ico} onChange={(e) => nastav("ico", e.target.value)} />
              </Field>
              <Field label="DIČ">
                <TextInput value={form.dic} onChange={(e) => nastav("dic", e.target.value)} />
              </Field>
              <Field label="E-mail">
                <TextInput
                  type="email"
                  value={form.email}
                  onChange={(e) => nastav("email", e.target.value)}
                  placeholder="kancelar@example.cz"
                />
              </Field>
              <Field label="Telefon">
                <TextInput
                  value={form.telefon}
                  onChange={(e) => nastav("telefon", e.target.value)}
                  placeholder="+420 123 456 789"
                />
              </Field>
              <Field label="Web" className="sm:col-span-2">
                <TextInput
                  value={form.web}
                  onChange={(e) => nastav("web", e.target.value)}
                  placeholder="www.example.cz"
                />
              </Field>
              <Field label="Bankovní účet" className="sm:col-span-2">
                <TextInput
                  value={form.ucet}
                  onChange={(e) => nastav("ucet", e.target.value)}
                  placeholder="1234567890/0300"
                />
              </Field>
              <Field label="Zápis v rejstříku" className="sm:col-span-2" hint="Např. „zapsaná u Krajského soudu v Ostravě, oddíl C, vložka 12345“.">
                <TextInput value={form.zapis} onChange={(e) => nastav("zapis", e.target.value)} />
              </Field>
              <Field label="Jednatel — jméno">
                <TextInput
                  value={form.jednatel}
                  onChange={(e) => nastav("jednatel", e.target.value)}
                />
              </Field>
              <Field label="Jednatel — funkce">
                <TextInput
                  value={form.jednatelFunkce}
                  onChange={(e) => nastav("jednatelFunkce", e.target.value)}
                  placeholder="jednatelka společnosti"
                />
              </Field>
            </div>

            <div className="mt-7 flex items-center gap-4 border-t border-line pt-6">
              <Tlacitko
                onClick={() => ulozFirmu.mutate(form, { onSuccess: () => setZmeneno(false) })}
                disabled={!zmeneno || ulozFirmu.isPending}
              >
                {ulozFirmu.isPending ? "Ukládám…" : zmeneno ? "Uložit údaje" : "Uloženo"}
              </Tlacitko>
              {ulozFirmu.isError ? (
                <span className="text-[13px] text-alert">{ulozFirmu.error.message}</span>
              ) : null}
              {ulozFirmu.isSuccess && !zmeneno ? (
                <span className="text-[13px] text-moss">Údaje kanceláře jsou uložené.</span>
              ) : null}
            </div>
          </>
        )}
      </section>

      <Hr />

      <section>
        <SectionTitle hint="Nevyplněná místa v dokumentech se zvýrazní žlutě, aby se dala snadno dohledat a doplnit.">
          Generování
        </SectionTitle>
        {volby.isLoading ? (
          <p className="text-ink-soft">Načítám…</p>
        ) : (
          <Check
            label="Zvýraznit nevyplněná místa"
            hint="Vypnuté = dokumenty vyjdou bez zvýraznění, prázdná místa zůstanou jen jako [X]."
            checked={Boolean(volby.data?.zvraznitNevyplnene)}
            disabled={ulozVolby.isPending}
            onChange={(e) => ulozVolby.mutate({ zvraznitNevyplnene: e.target.checked })}
          />
        )}
      </section>
    </>
  );
}

/* ----------------------------------------------------------------- Drive */

function DriveSekce() {
  const drive = useDriveStav();
  const diagnostika = useDriveDiagnostika();
  const odpojit = useDriveOdpojit();
  const vybrat = useVybratSlozku();
  const zrusit = useZrusitSlozku();

  const [cesta, setCesta] = useState<{ id: string; nazev: string }[]>([]);
  const aktualni = cesta.length ? cesta[cesta.length - 1].id : "root";
  const slozky = useDriveSlozky(aktualni);

  const pripojeno = Boolean(drive.data?.pripojeno);

  return (
    <section>
      <SectionTitle hint="Aplikace se jednou přihlásí účtem kanceláře a dokumenty pak ukládá přímo do složky zakázky.">
        Google Drive
      </SectionTitle>

      {drive.isLoading ? (
        <p className="text-ink-soft">Načítám…</p>
      ) : (
        <div className="border border-line">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 px-5 py-5">
            <div>
              <span className="field-label">Stav připojení</span>
              <span className={pripojeno ? "text-[15px] text-moss" : "text-[15px] text-ink-soft"}>
                {pripojeno
                  ? `Připojeno${drive.data?.email ? ` — ${drive.data.email}` : ""}`
                  : "Nepřipojeno"}
              </span>
            </div>
            <div>
              <span className="field-label">Cílová složka</span>
              <span className="text-[15px] text-ink">
                {drive.data?.slozkaId ? (
                  <a
                    className="text-brick underline"
                    href={`https://drive.google.com/drive/folders/${drive.data.slozkaId}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {drive.data.slozkaNazev || drive.data.slozkaId}
                  </a>
                ) : (
                  <span className="text-ink-soft">Nevybrána</span>
                )}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {pripojeno ? (
                <Tlacitko
                  varianta="obrys"
                  disabled={odpojit.isPending}
                  onClick={async () => {
                    if (!confirm("Odpojit Google Drive? Dokumenty pak půjde jen stáhnout.")) return;
                    await odpojit.mutateAsync({});
                    setCesta([]);
                  }}
                >
                  Odpojit Drive
                </Tlacitko>
              ) : (
                <a
                  href="/api/drive/connect"
                  className={
                    drive.data?.nakonfigurovano
                      ? "inline-flex items-center justify-center rounded-[2px] bg-brick px-4 py-[7px] text-[13px] tracking-[0.04em] text-white transition-colors hover:bg-brick-deep"
                      : "pointer-events-none inline-flex items-center justify-center rounded-[2px] bg-brick px-4 py-[7px] text-[13px] tracking-[0.04em] text-white opacity-50"
                  }
                >
                  Připojit Google Drive
                </a>
              )}
            </div>
          </div>

          {!drive.data?.nakonfigurovano ? (
            <DiagnostikaBlok
              chybi={diagnostika.data?.chybi ?? []}
              uri={diagnostika.data?.prehlasovaciUri ?? ""}
            />
          ) : null}

          {pripojeno ? (
            <div className="border-t border-line px-5 py-5">
              <span className="field-label">Vyberte složku, do které se mají dokumenty ukládat</span>
              <p className="mb-4 text-[12px] text-ink-soft">
                Aplikace v ní pro každou zakázku založí vlastní složku „číslo – název stavby“.
              </p>

              <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
                <button
                  type="button"
                  className="text-brick hover:underline"
                  onClick={() => setCesta([])}
                >
                  Můj disk
                </button>
                {cesta.map((k, i) => (
                  <span key={k.id} className="flex items-center gap-2">
                    <span className="text-ink-soft">/</span>
                    <button
                      type="button"
                      className={
                        i === cesta.length - 1 ? "text-ink" : "text-brick hover:underline"
                      }
                      onClick={() => setCesta((c) => c.slice(0, i + 1))}
                    >
                      {k.nazev}
                    </button>
                  </span>
                ))}
              </div>

              {slozky.isLoading ? (
                <p className="text-[13px] text-ink-soft">Načítám složky…</p>
              ) : slozky.isError ? (
                <p className="text-[13px] text-alert">
                  Složky se nepodařilo načíst: {slozky.error.message}
                </p>
              ) : !slozky.data?.slozky.length ? (
                <p className="text-[13px] text-ink-soft">V této složce nejsou žádné podsložky.</p>
              ) : (
                <ul className="max-h-[320px] overflow-y-auto border-y border-line">
                  {slozky.data.slozky.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-4 border-b border-line/60 px-1 py-2 last:border-b-0"
                    >
                      <button
                        type="button"
                        className="text-left text-[14px] text-ink hover:text-brick"
                        onClick={() => setCesta((c) => [...c, { id: s.id, nazev: s.nazev }])}
                        title="Otevřít složku"
                      >
                        {s.nazev}
                        <span className="ml-2 text-[11px] text-ink-soft">
                          {formatDatumCas(s.upraveno)}
                        </span>
                      </button>
                      <Tlacitko
                        varianta="obrys"
                        className="shrink-0 px-3 py-[4px] text-[12px]"
                        disabled={vybrat.isPending}
                        onClick={() =>
                          vybrat.mutate({ id: s.id, nazev: s.nazev })
                        }
                      >
                        Vybrat tuto
                      </Tlacitko>
                    </li>
                  ))}
                </ul>
              )}

              {cesta.length ? (
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <Tlacitko
                    varianta="obrys"
                    disabled={vybrat.isPending}
                    onClick={() =>
                      vybrat.mutate({
                        id: aktualni,
                        nazev: cesta[cesta.length - 1].nazev,
                      })
                    }
                  >
                    Vybrat otevřenou složku
                  </Tlacitko>
                  <Tlacitko varianta="text" onClick={() => setCesta((c) => c.slice(0, -1))}>
                    Zpět o úroveň
                  </Tlacitko>
                </div>
              ) : null}

              {vybrat.isError ? (
                <p className="mt-3 text-[13px] text-alert">{vybrat.error.message}</p>
              ) : null}
              {vybrat.isSuccess ? (
                <p className="mt-3 text-[13px] text-moss">
                  Cílová složka uložena: {vybrat.data?.slozkaNazev || vybrat.data?.slozkaId}
                </p>
              ) : null}

              {drive.data?.slozkaId ? (
                <div className="mt-4">
                  <Tlacitko
                    varianta="text"
                    onClick={() => {
                      if (!confirm("Zrušit výběr cílové složky?")) return;
                      zrusit.mutate({});
                    }}
                  >
                    Zrušit výběr složky
                  </Tlacitko>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      {drive.isError ? (
        <p className="mt-4 text-[13px] text-alert">Stav Disku se nepodařilo načíst.</p>
      ) : null}
    </section>
  );
}

function DiagnostikaBlok({ chybi, uri }: { chybi: string[]; uri: string }) {
  return (
    <div className="border-t border-line bg-note-wash px-5 py-4">
      <p className="text-[13px] text-ink">
        Připojení k Disku ještě není nastavené. Do souboru <code className="font-mono">.env</code> v
        kořeni aplikace doplňte:
      </p>
      <ul className="mt-2 space-y-1 font-mono text-[12px] text-ink-soft">
        <li className={chybi.includes("GOOGLE_CLIENT_ID") ? "text-alert" : ""}>
          GOOGLE_CLIENT_ID
          {chybi.includes("GOOGLE_CLIENT_ID") ? "  ← chybí" : "  ✓"}
        </li>
        <li className={chybi.includes("GOOGLE_CLIENT_SECRET") ? "text-alert" : ""}>
          GOOGLE_CLIENT_SECRET
          {chybi.includes("GOOGLE_CLIENT_SECRET") ? "  ← chybí" : "  ✓"}
        </li>
        <li className={chybi.includes("GOOGLE_REDIRECT_URI") ? "text-alert" : ""}>
          GOOGLE_REDIRECT_URI
          {chybi.includes("GOOGLE_REDIRECT_URI") ? "  ← chybí" : "  ✓ (dopočítá se z WEBSITE_URL)"}
        </li>
      </ul>
      <p className="mt-3 text-[12px] text-ink-soft">
        Hodnoty získáte v Google Cloud Console → API a služby → Přihlašovací údaje → OAuth client ID
        (typ Web application). Jako autorizovaný přesměrovávací URI nastavte:
      </p>
      {uri ? (
        <p className="mt-1 font-mono text-[12px] text-ink break-all">{uri}</p>
      ) : (
        <p className="mt-1 text-[12px] text-alert">
          Adresu aplikace neznáme — doplňte i <code className="font-mono">GOOGLE_REDIRECT_URI</code>.
        </p>
      )}
    </div>
  );
}
