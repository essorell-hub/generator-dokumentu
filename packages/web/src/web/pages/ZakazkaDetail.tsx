import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { Check, Field, Select, TextInput, Tlacitko } from "../components/fields";
import { Hr, PageTitle, SectionTitle, StavBadge } from "../components/layout";
import { formatDatumCas, formatDatumIso, formatVelikost } from "../lib/format";
import { useKontrola, useGenerovat, useHistorie, useKatalog } from "../queries/generovani";
import { useDriveStav } from "../queries/nastaveni";
import { ProvozniDenik } from "../components/denik";
import { useSmazatZakazku, useUpravitZakazku, useZakazka } from "../queries/zakazky";

type Formular = Record<string, string>;

const PRAZDNY: Formular = {
  cislo: "",
  revize: "00",
  nazevStavby: "",
  nazevObjektu: "",
  poznamka: "",
  adresaStavby: "",
  parcela: "",
  katastr: "",
  kraj: "",
  typStavby: "",
  stupenDokumentace: "dokumentace pro povolení stavby",
  castDokumentace: "D.1.2.5 TPS – Silnoproud",
  prilohaVyhlasky: "1",
  profese: "ELEKTROINSTALACE / FVE / LPS / MaR",
  investor: "",
  investorAdresa: "",
  investorIco: "",
  investorDic: "",
  investorZastupce: "",
  zakaznik: "",
  zakaznikAdresa: "",
  zakaznikIco: "",
  zakaznikDic: "",
  zakaznikZastupce: "",
  zakaznikKontakt: "",
  projektantJmeno: "",
  projektantAutorizace: "",
  projektantObor: "",
  projektantSpecializace: "",
  zpracovatelJmeno: "",
  elektroTechnikJmeno: "",
  elektroTechnikAutorizace: "",
  datum: "",
  datumMistnihoSetreni: "",
  datumPristiRevize: "",
  cisloZpravy: "",
  cisloNabidky: "",
  cisloDokumentu: "",
  mistoPodpisu: "",
  soustava: "3 N PE AC 400/230 V, 50 Hz, TN-C-S",
  jistic: "",
  rezervovanyPrikon: "",
  vykonFve: "",
  distributor: "",
};

const POLE_FORMULARE = Object.keys(PRAZDNY);

export default function ZakazkaDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, naviguj] = useLocation();

  const detail = useZakazka(id);
  const upravit = useUpravitZakazku();
  const smazat = useSmazatZakazku();
  const katalog = useKatalog();
  const drive = useDriveStav();

  const [form, setForm] = useState<Formular>(PRAZDNY);
  const [vybrane, setVybrane] = useState<string[]>([]);
  const [zmeneno, setZmeneno] = useState(false);
  const [otevrenyNahled, setOtevrenyNahled] = useState<string | null>(null);

  useEffect(() => {
    if (!detail.data) return;
    const zakazka = detail.data.zakazka as unknown as Record<string, unknown>;
    const novy: Formular = { ...PRAZDNY };
    for (const klic of POLE_FORMULARE) {
      const hodnota = zakazka[klic];
      if (typeof hodnota === "string") novy[klic] = hodnota;
    }
    setForm(novy);
    setZmeneno(false);
  }, [detail.data]);

  // Výchozí výběr jen jednou: projektová a revizní dokumentace. Dokumenty pro provoz
  // VEZ si uživatel přidá, když je provozovatel objednal.
  const vychoziNastaven = useRef(false);
  useEffect(() => {
    if (katalog.data && !vychoziNastaven.current) {
      vychoziNastaven.current = true;
      setVybrane(katalog.data.filter((d) => d.skupina === "projekt").map((d) => d.klic));
    }
  }, [katalog.data]);

  const vsechnyKlice = useMemo(() => (katalog.data ?? []).map((d) => d.klic), [katalog.data]);
  const skupiny = useMemo(
    () =>
      [
        {
          klic: "projekt" as const,
          nazev: "Projekt a revize",
          popis: "Projektová dokumentace, technické zprávy a revizní dokumentace zakázky.",
        },
        {
          klic: "provoz" as const,
          nazev: "Provoz VEZ — pro provozovatele",
          popis:
            "Dokumenty, které provozovatel vyhrazeného elektrického zařízení musí mít podle NV č. 190/2022 Sb. a NV č. 194/2022 Sb.: řád prohlídek, vyhodnocení rizika, pověření, záznam o školení, provozní deník, souhrnná zpráva.",
        },
      ].map((g) => ({ ...g, polozky: (katalog.data ?? []).filter((d) => d.skupina === g.klic) })),
    [katalog.data],
  );

  // Kontrola vyplnění běží pro celý katalog, aby i nevybrané dokumenty ukazovaly pravdivý stav.
  const kontrola = useKontrola(id, vsechnyKlice);
  const historie = useHistorie(id);
  const generovat = useGenerovat();

  const poctyNevyplneno = useMemo(() => {
    const mapa = new Map<string, string[]>();
    for (const k of kontrola.data ?? []) mapa.set(k.klic, k.nevyplneno);
    return mapa;
  }, [kontrola.data]);

  const nastav = (klic: string, hodnota: string) => {
    setForm((f) => ({ ...f, [klic]: hodnota }));
    setZmeneno(true);
  };

  const ulozit = () => {
    upravit.mutate({ id, ...form }, { onSuccess: () => setZmeneno(false) });
  };

  const prepni = (klic: string) =>
    setVybrane((v) => (v.includes(klic) ? v.filter((k) => k !== klic) : [...v, klic]));

  if (detail.isLoading) return <p className="text-ink-soft">Načítám…</p>;
  if (detail.isError || !detail.data) {
    return (
      <div>
        <p className="text-alert">Zakázku se nepodařilo načíst.</p>
        <Link href="/" className="text-brick underline">
          Zpět na seznam
        </Link>
      </div>
    );
  }

  const zakazka = detail.data.zakazka;
  const zakazkaCislo = zakazka.cislo;

  return (
    <>
      <div className="mb-3">
        <Link href="/" className="text-[12px] tracking-[0.14em] text-ink-soft uppercase hover:text-brick">
          ← Zakázky
        </Link>
      </div>

      <PageTitle
        podtitul={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[13px] text-ink-soft">{zakazkaCislo}</span>
            <StavBadge stav={zakazka.stav} />
            {zakazka.adresaStavby ? <span>{zakazka.adresaStavby}</span> : null}
          </span>
        }
      >
        {zakazka.nazevStavby || "Zakázka bez názvu"}
      </PageTitle>

      {/* ------------------------------------------------------- údaje */}
      <section>
        <SectionTitle hint="Údaje se propisují do dokumentů na místa označená hranatými závorkami.">
          Údaje zakázky
        </SectionTitle>

        <Blok nazev="Identifikace">
          <Pole klic="cislo" form={form} nastav={nastav} label="Číslo zakázky" />
          <Pole klic="revize" form={form} nastav={nastav} label="Revize" />
          <Pole klic="nazevStavby" form={form} nastav={nastav} label="Název stavby" siroke />
          <Pole klic="nazevObjektu" form={form} nastav={nastav} label="Objekt / stavební objekt" />
          <Pole klic="poznamka" form={form} nastav={nastav} label="Interní poznámka" siroke />
        </Blok>

        <Blok nazev="Místo stavby">
          <Pole klic="adresaStavby" form={form} nastav={nastav} label="Adresa stavby" siroke />
          <Pole klic="parcela" form={form} nastav={nastav} label="Parcelní čísla" />
          <Pole klic="katastr" form={form} nastav={nastav} label="Katastrální území" />
          <Pole klic="kraj" form={form} nastav={nastav} label="Kraj" />
        </Blok>

        <Blok nazev="Dokumentace">
          <Pole
            klic="typStavby"
            form={form}
            nastav={nastav}
            label="Druh a účel stavby"
            placeholder="nová stavba; trvalá stavba; bydlení"
            siroke
          />
          <Pole klic="stupenDokumentace" form={form} nastav={nastav} label="Stupeň dokumentace" typ="vyber"
            moznosti={["dokumentace pro povolení stavby", "dokumentace pro provádění stavby"]} siroke />
          <Pole klic="castDokumentace" form={form} nastav={nastav} label="Část dokumentace" typ="vyber"
            moznosti={[
              "D.1.2.5 TPS – Silnoproud",
              "D.1.2.6 Elektronické komunikace",
              "D.1.2.8 Měření a regulace",
            ]} />
          <Pole klic="prilohaVyhlasky" form={form} nastav={nastav} label="Příloha vyhlášky 131/2024 Sb." typ="vyber"
            moznosti={["1", "8", "9"]} />
          <Pole klic="profese" form={form} nastav={nastav} label="Profese" typ="vyber"
            moznosti={[
              "ELEKTROINSTALACE / FVE / LPS / MaR",
              "ELEKTROINSTALACE",
              "FVE",
              "LPS",
              "MaR",
            ]} />
        </Blok>

        <Blok nazev="Investor / stavebník">
          <Pole klic="investor" form={form} nastav={nastav} label="Název / jméno" siroke />
          <Pole klic="investorAdresa" form={form} nastav={nastav} label="Adresa" siroke />
          <Pole klic="investorIco" form={form} nastav={nastav} label="IČO" />
          <Pole klic="investorDic" form={form} nastav={nastav} label="DIČ" />
          <Pole klic="investorZastupce" form={form} nastav={nastav} label="Zastoupený" siroke />
        </Blok>

        <Blok
          nazev="Objednatel (smlouva a nabídka)"
          hint="Když je objednatel stejný jako investor, nechte blok prázdný — použije se investor."
        >
          <Pole klic="zakaznik" form={form} nastav={nastav} label="Název / jméno" siroke />
          <Pole klic="zakaznikAdresa" form={form} nastav={nastav} label="Adresa" siroke />
          <Pole klic="zakaznikIco" form={form} nastav={nastav} label="IČO" />
          <Pole klic="zakaznikDic" form={form} nastav={nastav} label="DIČ" />
          <Pole klic="zakaznikZastupce" form={form} nastav={nastav} label="Zastoupený" />
          <Pole klic="zakaznikKontakt" form={form} nastav={nastav} label="Kontakt" />
        </Blok>

        <Blok nazev="Osoby">
          <Pole klic="projektantJmeno" form={form} nastav={nastav} label="Hlavní projektant" />
          <Pole klic="projektantAutorizace" form={form} nastav={nastav} label="Autorizace ČKAIT / ČKA" />
          <Pole klic="projektantObor" form={form} nastav={nastav} label="Obor" />
          <Pole klic="projektantSpecializace" form={form} nastav={nastav} label="Specializace" />
          <Pole klic="zpracovatelJmeno" form={form} nastav={nastav} label="Zpracoval" hint="Prázdné = hlavní projektant" />
          <Pole klic="elektroTechnikJmeno" form={form} nastav={nastav} label="Odpovědný technik / revizní technik" />
          <Pole klic="elektroTechnikAutorizace" form={form} nastav={nastav} label="Autorizace technika" />
        </Blok>

        <Blok nazev="Termíny a čísla">
          <Pole klic="datum" form={form} nastav={nastav} label="Datum zpracování" typ="datum" />
          <Pole klic="datumMistnihoSetreni" form={form} nastav={nastav} label="Místní šetření" typ="datum" />
          <Pole klic="datumPristiRevize" form={form} nastav={nastav} label="Platnost / další revize" typ="datum" />
          <Pole klic="mistoPodpisu" form={form} nastav={nastav} label="Místo podpisu" />
          <Pole klic="cisloZpravy" form={form} nastav={nastav} label="Číslo revizní zprávy" />
          <Pole klic="cisloNabidky" form={form} nastav={nastav} label="Číslo nabídky" />
          <Pole klic="cisloDokumentu" form={form} nastav={nastav} label="Označení dokumentace" />
        </Blok>

        <Blok nazev="Technické parametry">
          <Pole klic="soustava" form={form} nastav={nastav} label="Soustava" siroke />
          <Pole klic="jistic" form={form} nastav={nastav} label="Hlavní jistič [A]" />
          <Pole klic="rezervovanyPrikon" form={form} nastav={nastav} label="Rezervovaný příkon [kW]" />
          <Pole klic="vykonFve" form={form} nastav={nastav} label="Výkon FVE [kWp]" />
          <Pole klic="distributor" form={form} nastav={nastav} label="Distributor" />
        </Blok>

        <div className="flex items-center gap-4 border-t border-line pt-6">
          <Tlacitko onClick={ulozit} disabled={!zmeneno || upravit.isPending}>
            {upravit.isPending ? "Ukládám…" : zmeneno ? "Uložit údaje" : "Uloženo"}
          </Tlacitko>
          {upravit.isError ? (
            <span className="text-[13px] text-alert">{upravit.error.message}</span>
          ) : null}
          <Tlacitko
            varianta="text"
            className="ml-auto text-alert"
            onClick={async () => {
              if (!confirm(`Smazat zakázku ${zakazkaCislo} včetně záznamů o vygenerovaných souborech?`)) return;
              await smazat.mutateAsync({ id });
              naviguj("/");
            }}
          >
            Smazat zakázku
          </Tlacitko>
        </div>
      </section>

      <Hr />

      {/* ---------------------------------------------------- generátor */}
      <section>
        <SectionTitle
          align="center"
          hint="Vygenerované soubory se nahrají do složky zakázky na Google Drive. Žlutě zvýrazněná místa v dokumentech je potřeba doplnit ručně."
        >
          Generátor dokumentů
        </SectionTitle>

        {drive.data && !drive.data.pripojeno ? (
          <div className="mb-8 border border-line bg-note-wash px-5 py-4">
            <p className="text-[14px] text-ink">
              Google Drive zatím není připojen, soubory proto půjde jen stáhnout.{" "}
              <Link href="/nastaveni" className="text-brick underline">
                Připojit v Nastavení
              </Link>
              .
            </p>
          </div>
        ) : null}

        {drive.data?.pripojeno && !drive.data.slozkaId ? (
          <div className="mb-8 border border-line bg-note-wash px-5 py-4">
            <p className="text-[14px] text-ink">
              Není vybraná cílová složka na Disku.{" "}
              <Link href="/nastaveni" className="text-brick underline">
                Vybrat složku
              </Link>
              .
            </p>
          </div>
        ) : null}

        {skupiny.map((g) => {
          const klice = g.polozky.map((d) => d.klic);
          const vybranoVSkupine = klice.filter((k) => vybrane.includes(k)).length;
          const vse = vybranoVSkupine === klice.length && klice.length > 0;
          return (
            <div key={g.klic} className="mb-10">
              <header className="mb-2 flex flex-wrap items-end justify-between gap-4 border-b border-brick/30 pb-3">
                <div>
                  <h3 className="text-[15px] text-brick-deep">
                    {g.nazev}
                    <span className="ml-3 text-[12px] text-ink-soft">
                      {vybranoVSkupine} / {klice.length}
                    </span>
                  </h3>
                  <p className="mt-1 max-w-[80ch] text-[12px] text-ink-soft">{g.popis}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setVybrane((v) =>
                      vse ? v.filter((k) => !klice.includes(k)) : [...v.filter((k) => !klice.includes(k)), ...klice],
                    )
                  }
                  className="text-[12px] tracking-[0.08em] text-ink-soft uppercase hover:text-brick"
                >
                  {vse ? "Odznačit skupinu" : "Označit skupinu"}
                </button>
              </header>
              <div className="grid gap-x-10 gap-y-1 md:grid-cols-2">
                {g.polozky.map((d) => {
                  const vybrano = vybrane.includes(d.klic);
                  const nevyplneno = poctyNevyplneno.get(d.klic);
                  const otevreno = otevrenyNahled === d.klic;
                  return (
                    <div key={d.klic} className="border-b border-line py-3">
                      <Check
                        checked={vybrano}
                        onChange={() => prepni(d.klic)}
                        label={
                          <span className="flex items-baseline gap-2">
                            <span className="font-mono text-[12px] text-ink-soft">{d.klic}</span>
                            <span>{d.nazev}</span>
                          </span>
                        }
                        hint={d.popis}
                      />
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pl-7">
                        <span className="font-mono text-[11px] text-ink-soft">{d.revize}</span>
                        {d.predpis ? <span className="text-[11px] text-ink-soft">{d.predpis}</span> : null}
                        {kontrola.isLoading ? (
                          <span className="text-[12px] text-ink-soft">kontroluji…</span>
                        ) : nevyplneno?.length ? (
                          <button
                            type="button"
                            onClick={() => setOtevrenyNahled(otevreno ? null : d.klic)}
                            className="text-[12px] text-clay hover:text-brick-deep"
                          >
                            {nevyplneno.length} míst k doplnění {otevreno ? "▴" : "▾"}
                          </button>
                        ) : nevyplneno ? (
                          <span className="text-[12px] text-moss">vše vyplněno</span>
                        ) : null}
                      </div>
                      {otevreno && nevyplneno ? (
                        <ul className="mt-3 ml-7 space-y-1">
                          {nevyplneno.map((n) => (
                            <li key={n} className="text-[12px] leading-snug text-ink-soft">
                              <span className="hint-highlight">{n.slice(0, 140)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Tlacitko
            onClick={() => generovat.mutate({ zakazkaId: id, klice: vybrane })}
            disabled={generovat.isPending || vybrane.length === 0}
          >
            {generovat.isPending ? "Generuji…" : `Vygenerovat ${vybrane.length} ${vybrane.length === 1 ? "dokument" : vybrane.length >= 2 && vybrane.length <= 4 ? "dokumenty" : "dokumentů"}`}
          </Tlacitko>
          <a
            href={`/api/soubory/zip?zakazkaId=${id}${vybrane.length ? `&klice=${vybrane.join(",")}` : ""}`}
            className="rounded-[2px] border border-brick px-4 py-[7px] text-[13px] text-brick transition-colors hover:bg-brick-wash"
          >
            Stáhnout ZIP
          </a>
          <button
            type="button"
            onClick={() =>
              setVybrane(
                vybrane.length === vsechnyKlice.length ? [] : vsechnyKlice,
              )
            }
            className="text-[12px] tracking-[0.08em] text-ink-soft uppercase hover:text-brick"
          >
            {vybrane.length === vsechnyKlice.length ? "Odznačit vše" : "Označit vše"}
          </button>
        </div>

        {generovat.isError ? (
          <p className="mt-4 text-[13px] text-alert">Generování selhalo: {generovat.error.message}</p>
        ) : null}

        {generovat.data ? (
          <div className="mt-6 border border-line bg-brick-wash/50 px-5 py-4">
            <p className="text-[14px] text-ink">
              Vygenerováno {generovat.data.vysledky.length} dokumentů
              {generovat.data.slozkaId ? (
                <>
                  {" "}
                  do složky{" "}
                  <a
                    className="text-brick underline"
                    href={generovat.data.slozkaUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {generovat.data.slozkaNazev}
                  </a>
                </>
              ) : (
                " — soubory jsou připravené ke stažení níže."
              )}
            </p>
            {generovat.data.vysledky.some((v) => v.chyba) ? (
              <ul className="mt-3 space-y-1">
                {generovat.data.vysledky
                  .filter((v) => v.chyba)
                  .map((v) => (
                    <li key={v.klic} className="text-[12px] text-alert">
                      {v.klic}: {v.chyba}
                    </li>
                  ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </section>

      <Hr />

      {/* ------------------------------------------------ provozní deník */}
      <section>
        <SectionTitle hint="Prohlídky, zkoušky, údržba a opravy zařízení podle řádu prohlídek (§ 7 odst. 5 NV č. 190/2022 Sb.). Záznamy se propisují do dokumentu P11 Provozní deník.">
          Provozní deník
        </SectionTitle>
        <ProvozniDenik zakazkaId={id} />
      </section>

      {historie.data?.length ? (
        <>
          <Hr />
          <section>
            <SectionTitle>Poslední vygenerované soubory</SectionTitle>
            <table className="tabulka">
              <thead>
                <tr>
                  <th className="w-[70px]">Dok.</th>
                  <th>Název souboru</th>
                  <th className="w-[130px]">Vytvořeno</th>
                  <th className="w-[90px]">Velikost</th>
                  <th className="w-[110px]">K doplnění</th>
                  <th className="w-[130px]" />
                </tr>
              </thead>
              <tbody>
                {historie.data.map((s) => (
                  <tr key={s.id}>
                    <td className="font-mono text-[12px] text-ink-soft">{s.klic}</td>
                    <td className="text-[13px] text-ink">{s.nazevSouboru}</td>
                    <td className="text-[12px] text-ink-soft">{formatDatumCas(s.createdAt)}</td>
                    <td className="text-[12px] text-ink-soft">{formatVelikost(s.velikost)}</td>
                    <td className="text-[12px] text-ink-soft">{s.nevyplneno}</td>
                    <td className="text-right text-[12px]">
                      {s.driveUrl ? (
                        <a className="text-brick underline" href={s.driveUrl} target="_blank" rel="noreferrer">
                          Otevřít na Disku
                        </a>
                      ) : (
                        <a
                          className="text-brick underline"
                          href={`/api/soubory/docx?zakazkaId=${id}&klic=${s.klic}`}
                        >
                          Stáhnout
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      ) : null}
    </>
  );
}

function Blok({
  nazev,
  hint,
  children,
}: {
  nazev: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-9">
      <h3 className="mb-4 text-[13px] tracking-[0.1em] text-brick-deep uppercase">{nazev}</h3>
      {hint ? <p className="mb-4 text-[12px] text-ink-soft">{hint}</p> : null}
      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Pole({
  klic,
  form,
  nastav,
  label,
  hint,
  placeholder,
  typ = "text",
  moznosti,
  siroke,
}: {
  klic: string;
  form: Formular;
  nastav: (klic: string, hodnota: string) => void;
  label: string;
  hint?: string;
  placeholder?: string;
  typ?: "text" | "datum" | "vyber";
  moznosti?: string[];
  siroke?: boolean;
}) {
  return (
    <Field label={label} hint={hint} className={siroke ? "sm:col-span-2" : undefined}>
      {typ === "vyber" ? (
        <Select value={form[klic]} onChange={(e) => nastav(klic, e.target.value)}>
          {(moznosti ?? []).map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
      ) : typ === "datum" ? (
        <TextInput
          type="date"
          value={form[klic]}
          onChange={(e) => nastav(klic, e.target.value)}
          title={form[klic] ? formatDatumIso(form[klic]) : undefined}
        />
      ) : (
        <TextInput
          value={form[klic]}
          placeholder={placeholder}
          onChange={(e) => nastav(klic, e.target.value)}
        />
      )}
    </Field>
  );
}
