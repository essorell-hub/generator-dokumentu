import { useState } from "react";
import { Field, Select, TextArea, TextInput, Tlacitko } from "@/components/fields";
import { Metrika, Metriky, Panel, Poznamka, PruhledneHledani, Stahnout, Znak, tonStavu } from "@/components/agenda";
import { PageTitle, PrazdnyStav } from "@/components/layout";
import { formatDatumIso } from "@/lib/format";
import { useRevize, useSmazatRevizi, useUlozitRevizi } from "@/queries/agenda";
import type { client } from "@/lib/api";

type Radek = Awaited<ReturnType<typeof client.revize.seznam>>["radky"][number];
type Formular = Partial<Radek> & { id?: number };

const PRAZDNY: Formular = {
  klient: "",
  objekt: "",
  druhRevize: "Pravidelná",
  datumPosledniRevize: "",
  lhutaDni: 1826,
  kontakt: "",
  poznamka: "",
};

export default function Revize() {
  const { data, isLoading } = useRevize();
  const ulozit = useUlozitRevizi();
  const smazat = useSmazatRevizi();
  const [formular, setFormular] = useState<Formular | null>(null);
  const [hledat, setHledat] = useState("");
  const [jenProblem, setJenProblem] = useState(false);
  const [chyba, setChyba] = useState("");

  const vsechny = data?.radky ?? [];
  const radky = vsechny.filter((r) => {
    if (jenProblem && r.stav !== "PO TERMÍNU" && r.stav !== "Blíží se") return false;
    if (hledat) {
      const h = hledat.toLowerCase();
      return (
        r.klient.toLowerCase().includes(h) ||
        r.objekt.toLowerCase().includes(h) ||
        r.kontakt.toLowerCase().includes(h)
      );
    }
    return true;
  });

  async function uloz() {
    if (!formular) return;
    if (!formular.klient?.trim() && !formular.objekt?.trim()) {
      setChyba("Vyplňte alespoň klienta nebo objekt — jinak se záznam nedá dohledat.");
      return;
    }
    setChyba("");
    const { zakazkaId, createdAt, updatedAt, stav, datumPristiRevize, dniDoTerminu, lhutaPopis, ...zbytek } =
      formular;
    await ulozit.mutateAsync({
      ...PRAZDNY,
      ...zbytek,
      id: formular.id,
      zakazkaId: zakazkaId ?? null,
      lhutaDni: Number(formular.lhutaDni) || 1826,
      datumPosledniRevize: zbytek.datumPosledniRevize ?? "",
      kontakt: zbytek.kontakt ?? "",
      poznamka: zbytek.poznamka ?? "",
      lhutaText: zbytek.lhutaText ?? "",
    });
    setFormular(null);
  }

  const zmen = (klic: keyof Formular, hodnota: unknown) =>
    setFormular((f) => (f ? { ...f, [klic]: hodnota } : f));

  const souhrn = data?.souhrn;

  return (
    <div>
      <PageTitle podtitul="Zákonné lhůty pravidelných revizí podle přílohy č. 4 nařízení vlády č. 190/2022 Sb. Termín se dopočítá z poslední revize a lhůty.">
        Hlídání revizních lhůt
      </PageTitle>

      <Metriky>
        <Metrika popisek="Sledovaných objektů" hodnota={souhrn?.pocet ?? 0} />
        <Metrika
          popisek="Po termínu"
          hodnota={souhrn?.poTerminu ?? 0}
          doplneni="lhůta už uplynula"
          ton="pozor"
        />
        <Metrika popisek="Blíží se" hodnota={souhrn?.bliziSe ?? 0} doplneni="do 60 dnů" ton="blizi" />
        <Metrika popisek="V termínu" hodnota={souhrn?.vTerminu ?? 0} ton="ok" />
        <Metrika popisek="Bez data" hodnota={souhrn?.bezDatu ?? 0} doplneni="chybí poslední revize" />
      </Metriky>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <PruhledneHledani hodnota={hledat} onChange={setHledat} placeholder="Hledat klienta nebo objekt…" />
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink-soft">
          <input
            type="checkbox"
            checked={jenProblem}
            onChange={(e) => setJenProblem(e.target.checked)}
            className="size-4 accent-[#B04A2F]"
          />
          jen po termínu a blížící se
        </label>
        <div className="ml-auto flex items-center gap-3">
          <Stahnout href="/api/soubory/evidence.xlsx">Stáhnout XLSX</Stahnout>
          <Tlacitko onClick={() => setFormular({ ...PRAZDNY })}>Přidat objekt</Tlacitko>
        </div>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-ink-soft">Načítám…</p>
      ) : radky.length === 0 ? (
        <PrazdnyStav
          nadpis="Nic ke hlídání"
          text="Zapište objekty, u kterých držíte zákonnou lhůtu pravidelných revizí. Termín další revize se dopočítá sám."
          akce={<Tlacitko onClick={() => setFormular({ ...PRAZDNY })}>Přidat objekt</Tlacitko>}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="tabulka">
            <thead>
              <tr>
                <th className="w-[150px]">Klient</th>
                <th>Objekt / adresa</th>
                <th className="w-[110px]">Druh</th>
                <th className="w-[110px]">Poslední revize</th>
                <th className="w-[210px]">Lhůta</th>
                <th className="w-[110px]">Příští revize</th>
                <th className="w-[90px] text-right">Dní</th>
                <th className="w-[100px]">Stav</th>
                <th className="w-[70px]" />
              </tr>
            </thead>
            <tbody>
              {radky.map((r) => (
                <tr key={r.id}>
                  <td className="text-[13px]">{r.klient || "—"}</td>
                  <td>
                    <button onClick={() => setFormular({ ...r })} className="text-left hover:text-brick">
                      {r.objekt || <span className="text-ink-soft">bez označení</span>}
                    </button>
                    {r.kontakt ? (
                      <span className="mt-1 block text-[12px] text-ink-soft">{r.kontakt}</span>
                    ) : null}
                  </td>
                  <td className="text-[13px]">{r.druhRevize}</td>
                  <td className="text-[13px] whitespace-nowrap">
                    {r.datumPosledniRevize ? formatDatumIso(r.datumPosledniRevize) : "—"}
                  </td>
                  <td className="text-[12px] text-ink-soft">{r.lhutaPopis}</td>
                  <td className="text-[13px] whitespace-nowrap">
                    {r.datumPristiRevize ? formatDatumIso(r.datumPristiRevize) : "—"}
                  </td>
                  <td className="text-right text-[13px] tabular-nums">
                    {r.dniDoTerminu === null ? "—" : r.dniDoTerminu}
                  </td>
                  <td>{r.stav ? <Znak ton={tonStavu(r.stav)}>{r.stav}</Znak> : "—"}</td>
                  <td>
                    <div className="flex justify-end gap-3 text-[12px]">
                      <button
                        onClick={() => setFormular({ ...r })}
                        className="text-brick hover:text-brick-deep"
                      >
                        upravit
                      </button>
                      <button
                        onClick={() => smazat.mutate({ id: r.id })}
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
      )}

      {formular ? (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-charcoal/40 py-10">
          <div className="mx-auto max-w-[720px] border border-line bg-paper px-7 py-7">
            <header className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="section-label">{formular.id ? "Úprava objektu" : "Nový objekt"}</p>
                <h2 className="mt-2 text-[22px] text-brick-deep">{formular.objekt || "Objekt bez označení"}</h2>
              </div>
              <button onClick={() => setFormular(null)} className="text-[13px] text-ink-soft hover:text-brick-deep">
                zavřít
              </button>
            </header>

            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <Field label="Klient">
                <TextInput value={formular.klient ?? ""} onChange={(e) => zmen("klient", e.target.value)} />
              </Field>
              <Field label="Objekt / adresa">
                <TextInput value={formular.objekt ?? ""} onChange={(e) => zmen("objekt", e.target.value)} />
              </Field>
              <Field label="Druh revize">
                <Select value={formular.druhRevize ?? "Pravidelná"} onChange={(e) => zmen("druhRevize", e.target.value)}>
                  {(data?.druhy ?? ["Výchozí", "Pravidelná", "Mimořádná"]).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Datum poslední revize">
                <TextInput
                  type="date"
                  value={formular.datumPosledniRevize ?? ""}
                  onChange={(e) => zmen("datumPosledniRevize", e.target.value)}
                />
              </Field>
              <Field
                label="Lhůta podle přílohy č. 4"
                hint="Vyberte lhůtu; termín další revize se dopočítá."
                className="sm:col-span-2"
              >
                <Select
                  value={String(formular.lhutaDni ?? 1826)}
                  onChange={(e) => zmen("lhutaDni", Number(e.target.value))}
                >
                  {(data?.lhuty ?? []).map((l) => (
                    <option key={l.dni} value={String(l.dni)}>
                      {l.popisek}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Kontakt" className="sm:col-span-2">
                <TextInput value={formular.kontakt ?? ""} onChange={(e) => zmen("kontakt", e.target.value)} />
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
                    Smazat
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

      <div className="mt-14">
        <Panel nadpis="Lhůty podle přílohy č. 4 NV 190/2022 Sb.">
          <ul className="divide-y divide-line border-y border-line">
            {(data?.lhuty ?? []).map((l) => (
              <li key={l.dni} className="flex items-baseline justify-between gap-6 py-3">
                <span className="w-[110px] text-[14px] text-brick-deep">{l.popisek.split(" – ")[0]}</span>
                <span className="flex-1 text-[13px] text-ink-soft">{l.popisek.split(" – ")[1]}</span>
                <span className="text-[12px] text-ink-soft tabular-nums">{l.dni} dní</span>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <Poznamka>
              Stav „Blíží se“ znamená, že do zákonné lhůty zbývá 60 dnů nebo méně. U položek se stavem
              „PO TERMÍNU“ už lhůta uplynula — je to záležitost k okamžitému řešení, ne jen připomínka.
              Aplikace termíny jen počítá a ukazuje; upozorňovací e-mail klientovi neodesílá sama, ten si
              připravíte v sekci E-maily a odešlete z Gmailu kanceláře.
            </Poznamka>
          </div>
        </Panel>
      </div>
    </div>
  );
}