import { useMemo, useState } from "react";
import { Field, Select, TextArea, TextInput, Tlacitko } from "@/components/fields";
import { Metrika, Metriky, Panel, Poznamka, PruhledneHledani, Stahnout, Znak, tonStavu } from "@/components/agenda";
import { PageTitle, SectionTitle } from "@/components/layout";
import { formatDatumIso } from "@/lib/format";
import {
  useNormy,
  useOznacitOvereno,
  useSmazatNormu,
  useSmazatTermin,
  useUlozitNormu,
  useUlozitTermin,
} from "@/queries/agenda";
import type { client } from "@/lib/api";

type Norma = Awaited<ReturnType<typeof client.normy.seznam>>["radky"][number];
type Termin = Awaited<ReturnType<typeof client.normy.seznam>>["terminy"][number];
type Formular = Partial<Norma> & { id?: number };

const PRAZDNY: Formular = {
  oznaceni: "",
  nazev: "",
  edice: "",
  druh: "ČSN",
  ucinnostOd: "",
  prechodneDo: "",
  pouziti: "",
  posledniOvereni: "",
  overil: "",
  stav: "platná",
  zjistenaEdice: "",
  odkazOverit: "",
  poznamka: "",
};

export default function Normy() {
  const [hledat, setHledat] = useState("");
  const [druh, setDruh] = useState("");
  const [kontrola, setKontrola] = useState("");
  const [formular, setFormular] = useState<Formular | null>(null);
  const [termin, setTermin] = useState<Partial<Termin> | null>(null);
  const [chyba, setChyba] = useState("");
  const [overovani, setOverovani] = useState<Norma | null>(null);
  const [zjistena, setZjistena] = useState("");

  const filtr = useMemo(
    () => ({ hledat: hledat || undefined, druh: druh || undefined, kontrola: kontrola || undefined }),
    [hledat, druh, kontrola],
  );

  const { data, isLoading } = useNormy(filtr);
  const ulozit = useUlozitNormu();
  const smazat = useSmazatNormu();
  const oznacit = useOznacitOvereno();
  const ulozitTermin = useUlozitTermin();
  const smazatTermin = useSmazatTermin();

  const radky = data?.radky ?? [];
  const souhrn = data?.souhrn;

  async function uloz() {
    if (!formular) return;
    if (!formular.oznaceni?.trim()) {
      setChyba("Označení normy je povinné — podle něj se norma hledá i u zakázek.");
      return;
    }
    setChyba("");
    const { id, createdAt, updatedAt, zmena, stavKontroly, ...zbytek } = formular;
    await ulozit.mutateAsync({
      ...PRAZDNY,
      ...zbytek,
      id,
      poradi: formular.poradi ?? 0,
      oznaceni: formular.oznaceni ?? "",
      nazev: zbytek.nazev ?? "",
      edice: zbytek.edice ?? "",
      druh: zbytek.druh ?? "ČSN",
      ucinnostOd: zbytek.ucinnostOd ?? "",
      prechodneDo: zbytek.prechodneDo ?? "",
      pouziti: zbytek.pouziti ?? "",
      posledniOvereni: zbytek.posledniOvereni ?? "",
      overil: zbytek.overil ?? "",
      stav: zbytek.stav ?? "platná",
      zjistenaEdice: zbytek.zjistenaEdice ?? "",
      odkazOverit: zbytek.odkazOverit ?? "",
      poznamka: zbytek.poznamka ?? "",
    });
    setFormular(null);
  }

  const zmen = (klic: keyof Formular, hodnota: unknown) =>
    setFormular((f) => (f ? { ...f, [klic]: hodnota } : f));

  return (
    <div>
      <PageTitle podtitul="Jediný zdroj pravdy o tom, které normy a předpisy kancelář používá. Odpovídá souboru Rejstrik_pouzitych_norem.">
        Rejstřík norem
      </PageTitle>

      <Metriky>
        <Metrika popisek="Norem a předpisů" hodnota={souhrn?.pocet ?? 0} />
        <Metrika popisek="Ověřeno" hodnota={souhrn?.ok ?? 0} doplneni="v posledních 12 měsících" ton="ok" />
        <Metrika popisek="Po termínu ověření" hodnota={souhrn?.poTerminu ?? 0} ton="pozor" />
        <Metrika popisek="K aktualizaci" hodnota={souhrn?.aktualizovat ?? 0} doplneni="zjištěna jiná edice" ton="pozor" />
        <Metrika popisek="Neověřeno" hodnota={souhrn?.neovereno ?? 0} ton="info" />
      </Metriky>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <PruhledneHledani hodnota={hledat} onChange={setHledat} placeholder="Hledat označení, název, šablonu…" />
        <Select value={druh} onChange={(e) => setDruh(e.target.value)} className="w-[170px]">
          <option value="">Všechny druhy</option>
          {(data?.ciselnik.druhy ?? []).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
        <Select value={kontrola} onChange={(e) => setKontrola(e.target.value)} className="w-[180px]">
          <option value="">Všechny stavy kontroly</option>
          {(data?.ciselnik.kontrola ?? []).map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </Select>
        <div className="ml-auto flex items-center gap-3">
          <Stahnout href="/api/soubory/normy.xlsx">Stáhnout XLSX</Stahnout>
          <Tlacitko onClick={() => setFormular({ ...PRAZDNY })}>Přidat normu</Tlacitko>
        </div>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-ink-soft">Načítám…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="tabulka">
            <thead>
              <tr>
                <th className="w-[40px]">Č.</th>
                <th className="w-[190px]">Označení</th>
                <th>Název</th>
                <th className="w-[120px]">Edice / rok</th>
                <th className="w-[110px]">Použití</th>
                <th className="w-[100px]">Ověřeno</th>
                <th className="w-[120px]">Stav kontroly</th>
                <th className="w-[90px]" />
              </tr>
            </thead>
            <tbody>
              {radky.map((r) => (
                <tr key={r.id}>
                  <td className="text-[13px] text-ink-soft">{r.poradi}</td>
                  <td>
                    <button onClick={() => setFormular({ ...r })} className="text-left font-mono text-[12px] hover:text-brick">
                      {r.oznaceni}
                    </button>
                    <span className="mt-1 block text-[11px] tracking-[0.06em] text-ink-soft uppercase">{r.druh}</span>
                  </td>
                  <td>
                    <span className="text-[13px]">{r.nazev}</span>
                    {r.poznamka ? <span className="mt-1 block text-[12px] text-ink-soft">{r.poznamka}</span> : null}
                  </td>
                  <td className="text-[13px]">{r.edice}</td>
                  <td className="font-mono text-[12px] text-ink-soft">{r.pouziti}</td>
                  <td className="text-[13px] whitespace-nowrap">
                    {r.posledniOvereni ? formatDatumIso(r.posledniOvereni) : "—"}
                  </td>
                  <td>
                    <div className="flex flex-col items-start gap-1">
                      <Znak ton={tonStavu(r.stavKontroly)}>{r.stavKontroly}</Znak>
                      {r.zmena === "ZMĚNA" ? <Znak ton="pozor">změna edice</Znak> : null}
                      {r.prechodneDo && r.prechodneDo !== "—" ? (
                        <span className="text-[11px] text-ink-soft">přechod do {r.prechodneDo}</span>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col items-end gap-1 text-[12px]">
                      {r.odkazOverit ? (
                        <a
                          href={r.odkazOverit}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brick hover:text-brick-deep"
                        >
                          ověřit zdroj
                        </a>
                      ) : null}
                      <button
                        onClick={() => {
                          setOverovani(r);
                          setZjistena(r.zjistenaEdice || r.edice);
                        }}
                        className="text-ink-soft hover:text-brick-deep"
                      >
                        zapsat ověření
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ------------------------------------------------ termíny a změny */}
      <div className="mt-14">
        <SectionTitle hint="Přechodná období zákonů a norem s dopadem na dokumentaci. Tyto termíny se přenášejí i do smlouvy o dílo — je nutné určit, k jakému datu se posuzuje soulad díla s normami.">
          Termíny a změny
        </SectionTitle>
        <div className="overflow-x-auto">
          <table className="tabulka">
            <thead>
              <tr>
                <th className="w-[120px]">Datum</th>
                <th className="w-[280px]">Co končí / začíná</th>
                <th>Dopad na dokumentaci</th>
                <th className="w-[130px]">Odpovídá</th>
                <th className="w-[80px]">Stav</th>
                <th className="w-[70px]" />
              </tr>
            </thead>
            <tbody>
              {(data?.terminy ?? []).map((t) => (
                <tr key={t.id}>
                  <td className="text-[13px] whitespace-nowrap">{t.datum}</td>
                  <td className="text-[13px]">{t.co}</td>
                  <td className="text-[13px] text-ink-soft">{t.dopad}</td>
                  <td className="text-[13px]">{t.odpovida || "—"}</td>
                  <td>
                    <Znak ton={t.stav === "[ ]" || !t.stav ? "blizi" : "ok"}>{t.stav || "vyřešit"}</Znak>
                  </td>
                  <td>
                    <div className="flex justify-end gap-3 text-[12px]">
                      <button onClick={() => setTermin({ ...t })} className="text-brick hover:text-brick-deep">
                        upravit
                      </button>
                      <button
                        onClick={() => smazatTermin.mutate({ id: t.id })}
                        className="text-ink-soft hover:text-alert"
                      >
                        smazat
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <Tlacitko varianta="obrys" onClick={() => setTermin({ datum: "", co: "", dopad: "", odpovida: "", stav: "[ ]" })}>
            Přidat termín
          </Tlacitko>
        </div>
      </div>

      <div className="mt-14">
        <Panel nadpis="Co rejstřík umí a co ne">
          <Poznamka>
            Stavy kontroly se počítají ze zapsaných údajů: „ZMĚNA“ znamená, že zjištěná edice se liší od zapsané,
            „PO TERMÍNU“ že poslední ověření je starší než 12 měsíců, „NEOVĚŘENO“ že datum ověření chybí.
            Rejstřík vede evidenci a odkazuje na zdroj — samočinně nestahuje Věstník ÚNMZ ani nečte obsah norem;
            obsahovou změnu vždy posoudí odpovědný projektant. Export do XLSX obsahuje stejné listy jako firemní
            soubor, včetně vzorců a odkazů „ověřit“.
          </Poznamka>
        </Panel>
      </div>

      {/* -------------------------------------------------- modal: norma */}
      {formular ? (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-charcoal/40 py-10">
          <div className="mx-auto max-w-[860px] border border-line bg-paper px-7 py-7">
            <header className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="section-label">{formular.id ? "Úprava normy" : "Nová norma"}</p>
                <h2 className="mt-2 text-[22px] text-brick-deep">{formular.oznaceni || "Norma bez označení"}</h2>
              </div>
              <button onClick={() => setFormular(null)} className="text-[13px] text-ink-soft hover:text-brick-deep">
                zavřít
              </button>
            </header>

            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <Field label="Označení">
                <TextInput value={formular.oznaceni ?? ""} onChange={(e) => zmen("oznaceni", e.target.value)} placeholder="ČSN 33 2000-4-41 ed. 3" />
              </Field>
              <Field label="Druh">
                <Select value={formular.druh ?? "ČSN"} onChange={(e) => zmen("druh", e.target.value)}>
                  {(data?.ciselnik.druhy ?? []).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Název" className="sm:col-span-2">
                <TextInput value={formular.nazev ?? ""} onChange={(e) => zmen("nazev", e.target.value)} />
              </Field>
              <Field label="Edice / rok">
                <TextInput value={formular.edice ?? ""} onChange={(e) => zmen("edice", e.target.value)} />
              </Field>
              <Field label="Stav">
                <Select value={formular.stav ?? "platná"} onChange={(e) => zmen("stav", e.target.value)}>
                  {(data?.ciselnik.stavy ?? []).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Účinnost od">
                <TextInput value={formular.ucinnostOd ?? ""} onChange={(e) => zmen("ucinnostOd", e.target.value)} placeholder="1. 1. 2025" />
              </Field>
              <Field label="Přechodné období do">
                <TextInput value={formular.prechodneDo ?? ""} onChange={(e) => zmen("prechodneDo", e.target.value)} placeholder="31. 10. 2027" />
              </Field>
              <Field label="Použití (šablony)" hint="Kódy dokumentů oddělené čárkou, např. 01, 04, 06" className="sm:col-span-2">
                <TextInput value={formular.pouziti ?? ""} onChange={(e) => zmen("pouziti", e.target.value)} placeholder="01, 04, 06" />
              </Field>
              <Field label="Poslední ověření">
                <TextInput type="date" value={formular.posledniOvereni ?? ""} onChange={(e) => zmen("posledniOvereni", e.target.value)} />
              </Field>
              <Field label="Ověřil">
                <TextInput value={formular.overil ?? ""} onChange={(e) => zmen("overil", e.target.value)} />
              </Field>
              <Field label="Zjištěná edice" hint="Vyplní se při ověření zdroje; liší-li se od zapsané, označí se ZMĚNA.">
                <TextInput value={formular.zjistenaEdice ?? ""} onChange={(e) => zmen("zjistenaEdice", e.target.value)} />
              </Field>
              <Field label="Odkaz „ověřit“">
                <TextInput value={formular.odkazOverit ?? ""} onChange={(e) => zmen("odkazOverit", e.target.value)} placeholder="https://agenturacas.gov.cz/…" />
              </Field>
            </div>

            <div className="mt-6">
              <Field label="Poznámka">
                <TextArea value={formular.poznamka ?? ""} onChange={(e) => zmen("poznamka", e.target.value)} rows={3} />
              </Field>
            </div>

            {chyba ? <p className="mt-5 text-[13px] text-alert">{chyba}</p> : null}

            <footer className="mt-8 flex items-center justify-between gap-4 border-t border-line pt-5">
              <div>
                {formular.id ? (
                  <Tlacitko
                    varianta="text"
                    onClick={async () => {
                      await smazat.mutateAsync({ id: formular.id as number });
                      setFormular(null);
                    }}
                  >
                    Smazat normu
                  </Tlacitko>
                ) : null}
              </div>
              <div className="flex gap-3">
                <Tlacitko varianta="obrys" onClick={() => setFormular(null)}>
                  Zrušit
                </Tlacitko>
                <Tlacitko onClick={uloz} disabled={ulozit.isPending}>
                  Uložit
                </Tlacitko>
              </div>
            </footer>
          </div>
        </div>
      ) : null}

      {/* ------------------------------------------- modal: zápis ověření */}
      {overovani ? (
        <div className="fixed inset-0 z-40 flex items-start justify-center bg-charcoal/40 pt-24">
          <div className="w-full max-w-[520px] border border-line bg-paper px-7 py-7">
            <p className="section-label">Zapsat ověření</p>
            <h2 className="mt-2 text-[20px] text-brick-deep">{overovani.oznaceni}</h2>
            <p className="mt-2 text-[13px] text-ink-soft">
              Zapsaná edice: {overovani.edice}
              {overovani.odkazOverit ? (
                <>
                  {" · "}
                  <a href={overovani.odkazOverit} target="_blank" rel="noreferrer" className="text-brick underline">
                    otevřít zdroj
                  </a>
                </>
              ) : null}
            </p>
            <div className="mt-5">
              <Field label="Zjištěná edice" hint="Nechte stejnou, když se norma nezměnila.">
                <TextInput value={zjistena} onChange={(e) => setZjistena(e.target.value)} />
              </Field>
            </div>
            <footer className="mt-7 flex justify-end gap-3">
              <Tlacitko varianta="obrys" onClick={() => setOverovani(null)}>
                Zrušit
              </Tlacitko>
              <Tlacitko
                onClick={async () => {
                  await oznacit.mutateAsync({ id: overovani.id, zjistenaEdice: zjistena });
                  setOverovani(null);
                }}
                disabled={oznacit.isPending}
              >
                Uložit ověření
              </Tlacitko>
            </footer>
          </div>
        </div>
      ) : null}

      {/* -------------------------------------------- modal: termín změny */}
      {termin ? (
        <div className="fixed inset-0 z-40 flex items-start justify-center bg-charcoal/40 pt-24">
          <div className="w-full max-w-[620px] border border-line bg-paper px-7 py-7">
            <p className="section-label">{termin.id ? "Úprava termínu" : "Nový termín"}</p>
            <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <Field label="Datum">
                <TextInput value={termin.datum ?? ""} onChange={(e) => setTermin({ ...termin, datum: e.target.value })} placeholder="30. 6. 2027" />
              </Field>
              <Field label="Odpovídá">
                <TextInput value={termin.odpovida ?? ""} onChange={(e) => setTermin({ ...termin, odpovida: e.target.value })} placeholder="[jméno]" />
              </Field>
              <Field label="Co končí / začíná" className="sm:col-span-2">
                <TextInput value={termin.co ?? ""} onChange={(e) => setTermin({ ...termin, co: e.target.value })} />
              </Field>
              <Field label="Dopad na dokumentaci" className="sm:col-span-2">
                <TextArea value={termin.dopad ?? ""} onChange={(e) => setTermin({ ...termin, dopad: e.target.value })} rows={3} />
              </Field>
              <Field label="Stav">
                <TextInput value={termin.stav ?? ""} onChange={(e) => setTermin({ ...termin, stav: e.target.value })} placeholder="[ ]" />
              </Field>
            </div>
            <footer className="mt-7 flex justify-end gap-3">
              <Tlacitko varianta="obrys" onClick={() => setTermin(null)}>
                Zrušit
              </Tlacitko>
              <Tlacitko
                onClick={async () => {
                  await ulozitTermin.mutateAsync({
                    id: termin.id,
                    datum: termin.datum ?? "",
                    co: termin.co ?? "",
                    dopad: termin.dopad ?? "",
                    odpovida: termin.odpovida ?? "",
                    stav: termin.stav ?? "",
                  });
                  setTermin(null);
                }}
                disabled={ulozitTermin.isPending}
              >
                Uložit
              </Tlacitko>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}