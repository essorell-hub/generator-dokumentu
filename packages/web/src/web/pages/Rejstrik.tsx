import { useMemo, useState } from "react";
import { Field, Select, TextArea, TextInput, Tlacitko } from "@/components/fields";
import { Metrika, Metriky, Panel, Poznamka, PruhledneHledani, Stahnout, Znak, tonStavu } from "@/components/agenda";
import { PageTitle, PrazdnyStav, SectionTitle } from "@/components/layout";
import { formatDatumIso } from "@/lib/format";
import {
  useBezEvidence,
  usePrepojitZakazku,
  useRejstrik,
  useSmazatEvidence,
  useUlozitEvidence,
} from "@/queries/agenda";
import type { client } from "@/lib/api";

type Radek = Awaited<ReturnType<typeof client.rejstrik.seznam>>["radky"][number];

type Formular = Partial<Radek> & { id?: number };

const PRAZDNY: Formular = {
  cislo: "",
  nazev: "",
  klient: "",
  kontakt: "",
  typ: "",
  stav: "Poptávka",
  datumPoptavky: "",
  terminOdevzdani: "",
  datumPredani: "",
  revizeDokumentace: "",
  datumRevize: "",
  cenaBezDph: 0,
  cisloFaktury: "",
  datumFakturace: "",
  datumUhrady: "",
  fakturovano: "Ne",
  zaplaceno: "Ne",
  posouzeniEru: "Ne",
  predaniProvozniDokumentace: "Ne",
  odkazNaSlozku: "",
  poznamka: "",
};

function koruny(cislo: number): string {
  return `${(cislo ?? 0).toLocaleString("cs-CZ")} Kč`;
}

export default function Rejstrik() {
  const [hledat, setHledat] = useState("");
  const [typ, setTyp] = useState("");
  const [stav, setStav] = useState("");
  const [nezaplaceno, setNezaplaceno] = useState(false);
  const [formular, setFormular] = useState<Formular | null>(null);
  const [chyba, setChyba] = useState("");

  const filtr = useMemo(
    () => ({ hledat: hledat || undefined, typ: typ || undefined, stav: stav || undefined, nezaplaceno }),
    [hledat, typ, stav, nezaplaceno],
  );

  const { data, isLoading } = useRejstrik(filtr);
  const { data: bezEvidence } = useBezEvidence();
  const ulozit = useUlozitEvidence();
  const smazat = useSmazatEvidence();
  const prepojit = usePrepojitZakazku();

  const radky = data?.radky ?? [];
  const souhrn = data?.souhrn;
  const ciselnik = data?.ciselnik;

  function otevrit(r: Radek) {
    setChyba("");
    setFormular({ ...r });
  }

  async function uloz() {
    if (!formular) return;
    if (!formular.cislo?.trim()) {
      setChyba("Číslo zakázky je povinné — podle něj se zakázka hledá i v rejstříku norem.");
      return;
    }
    setChyba("");
    const { zakazkaId, createdAt, updatedAt, ...zbytek } = formular;
    await ulozit.mutateAsync({
      ...PRAZDNY,
      ...zbytek,
      id: formular.id,
      cenaBezDph: Number(formular.cenaBezDph) || 0,
      zakazkaId: zakazkaId ?? null,
      datumPoptavky: zbytek.datumPoptavky ?? "",
      terminOdevzdani: zbytek.terminOdevzdani ?? "",
      datumPredani: zbytek.datumPredani ?? "",
      revizeDokumentace: zbytek.revizeDokumentace ?? "",
      datumRevize: zbytek.datumRevize ?? "",
      cisloFaktury: zbytek.cisloFaktury ?? "",
      datumFakturace: zbytek.datumFakturace ?? "",
      datumUhrady: zbytek.datumUhrady ?? "",
      odkazNaSlozku: zbytek.odkazNaSlozku ?? "",
      poznamka: zbytek.poznamka ?? "",
    });
    setFormular(null);
  }

  const zmen = (klic: keyof Formular, hodnota: unknown) =>
    setFormular((f) => (f ? { ...f, [klic]: hodnota } : f));

  return (
    <div>
      <PageTitle podtitul="Obchodní a fakturační evidence všech zakázek. Odpovídá souboru 13_Evidence_zakazek — včetně hlídání revizních lhůt a číselníků.">
        Rejstřík zakázek
      </PageTitle>

      <Metriky>
        <Metrika popisek="Zakázek v rejstříku" hodnota={souhrn?.pocet ?? 0} />
        <Metrika popisek="Cena bez DPH" hodnota={koruny(souhrn?.cenaCelkem ?? 0)} />
        <Metrika
          popisek="Neuhrazeno"
          hodnota={koruny(souhrn?.nezaplaceno ?? 0)}
          ton={(souhrn?.nezaplaceno ?? 0) > 0 ? "pozor" : "ok"}
        />
        <Metrika
          popisek="Nefakturováno"
          hodnota={souhrn?.nefakturovano ?? 0}
          doplneni="zakázek"
          ton={(souhrn?.nefakturovano ?? 0) > 0 ? "blizi" : "ok"}
        />
        <Metrika
          popisek="Nejčastější typ"
          hodnota={souhrn?.podleTypu[0]?.typ ?? "—"}
          doplneni={souhrn?.podleTypu[0] ? koruny(souhrn.podleTypu[0].cena) : undefined}
        />
      </Metriky>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <PruhledneHledani hodnota={hledat} onChange={setHledat} placeholder="Hledat číslo, název, klienta…" />
        <Select value={typ} onChange={(e) => setTyp(e.target.value)} className="w-[150px]">
          <option value="">Všechny typy</option>
          {(ciselnik?.typy ?? []).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <Select value={stav} onChange={(e) => setStav(e.target.value)} className="w-[150px]">
          <option value="">Všechny stavy</option>
          {(ciselnik?.stavy ?? []).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink-soft">
          <input
            type="checkbox"
            checked={nezaplaceno}
            onChange={(e) => setNezaplaceno(e.target.checked)}
            className="size-4 accent-[#B04A2F]"
          />
          jen neuhrazené
        </label>
        <div className="ml-auto flex items-center gap-3">
          <Stahnout href="/api/soubory/evidence.xlsx">Stáhnout XLSX</Stahnout>
          <Tlacitko onClick={() => setFormular({ ...PRAZDNY })}>Nová zakázka</Tlacitko>
        </div>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-ink-soft">Načítám…</p>
      ) : radky.length === 0 ? (
        <PrazdnyStav
          nadpis="Rejstřík je prázdný"
          text="Založte první záznam, nebo do rejstříku přeneste zakázky z generátoru dokumentů."
          akce={<Tlacitko onClick={() => setFormular({ ...PRAZDNY })}>Nová zakázka</Tlacitko>}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="tabulka">
            <thead>
              <tr>
                <th className="w-[90px]">Číslo</th>
                <th>Název</th>
                <th className="w-[140px]">Klient</th>
                <th className="w-[70px]">Typ</th>
                <th className="w-[110px]">Stav</th>
                <th className="w-[100px]">Termín</th>
                <th className="w-[110px] text-right">Cena bez DPH</th>
                <th className="w-[130px]">Fakturace</th>
                <th className="w-[90px]" />
              </tr>
            </thead>
            <tbody>
              {radky.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono text-[13px]">{r.cislo}</td>
                  <td>
                    <button onClick={() => otevrit(r)} className="text-left hover:text-brick">
                      {r.nazev || <span className="text-ink-soft">bez názvu</span>}
                    </button>
                    {r.poznamka ? (
                      <span className="mt-1 block text-[12px] text-ink-soft">{r.poznamka}</span>
                    ) : null}
                  </td>
                  <td className="text-[13px]">{r.klient || "—"}</td>
                  <td className="text-[13px]">{r.typ || "—"}</td>
                  <td>
                    <Znak ton={tonStavu(r.stav)}>{r.stav}</Znak>
                  </td>
                  <td className="text-[13px] whitespace-nowrap">
                    {r.terminOdevzdani ? formatDatumIso(r.terminOdevzdani) : "—"}
                  </td>
                  <td className="text-right text-[13px] whitespace-nowrap">{koruny(r.cenaBezDph)}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      <Znak ton={tonStavu(r.fakturovano)}>{r.fakturovano === "Ano" ? "faktura" : "nefakt."}</Znak>
                      <Znak ton={tonStavu(r.zaplaceno)}>{r.zaplaceno === "Ano" ? "uhrazeno" : "neuhraz."}</Znak>
                    </div>
                  </td>
                  <td>
                    <div className="flex justify-end gap-3 text-[12px]">
                      <button onClick={() => otevrit(r)} className="text-brick hover:text-brick-deep">
                        upravit
                      </button>
                      {r.zakazkaId ? (
                        <a href={`/zakazka/${r.zakazkaId}`} className="text-ink-soft hover:text-brick-deep">
                          dokumenty
                        </a>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {bezEvidence && bezEvidence.length > 0 ? (
        <div className="mt-12">
          <SectionTitle hint="Tyto zakázky vedené v generátoru dokumentů ještě nemají řádek v obchodním rejstříku. Přenese se číslo, název, klient, kontakt, typ a datum.">
            Zakázky mimo rejstřík ({bezEvidence.length})
          </SectionTitle>
          <ul className="divide-y divide-line border-y border-line">
            {bezEvidence.map((z) => (
              <li key={z.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="text-[14px]">
                  <span className="font-mono text-[13px] text-ink-soft">{z.cislo}</span>{" "}
                  {z.nazevStavby || "—"}
                  {z.zakaznik ? <span className="text-ink-soft"> · {z.zakaznik}</span> : null}
                </span>
                <Tlacitko
                  varianta="obrys"
                  disabled={prepojit.isPending}
                  onClick={() => prepojit.mutate({ zakazkaId: z.id })}
                >
                  Přenést do rejstříku
                </Tlacitko>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {formular ? (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-charcoal/40 py-10">
          <div className="mx-auto max-w-[900px] border border-line bg-paper px-7 py-7">
            <header className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="section-label">{formular.id ? "Úprava záznamu" : "Nový záznam"}</p>
                <h2 className="mt-2 text-[22px] text-brick-deep">
                  {formular.cislo || "Zakázka bez čísla"}
                </h2>
              </div>
              <button
                onClick={() => setFormular(null)}
                className="text-[13px] text-ink-soft hover:text-brick-deep"
              >
                zavřít
              </button>
            </header>

            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <Field label="Číslo zakázky">
                <TextInput value={formular.cislo ?? ""} onChange={(e) => zmen("cislo", e.target.value)} placeholder="2026-001" />
              </Field>
              <Field label="Název zakázky">
                <TextInput value={formular.nazev ?? ""} onChange={(e) => zmen("nazev", e.target.value)} />
              </Field>
              <Field label="Klient">
                <TextInput value={formular.klient ?? ""} onChange={(e) => zmen("klient", e.target.value)} />
              </Field>
              <Field label="Kontakt">
                <TextInput value={formular.kontakt ?? ""} onChange={(e) => zmen("kontakt", e.target.value)} placeholder="e-mail, telefon" />
              </Field>
              <Field label="Typ">
                <Select value={formular.typ ?? ""} onChange={(e) => zmen("typ", e.target.value)}>
                  <option value="">—</option>
                  {(ciselnik?.typy ?? []).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Stav">
                <Select value={formular.stav ?? "Poptávka"} onChange={(e) => zmen("stav", e.target.value)}>
                  {(ciselnik?.stavy ?? []).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Datum poptávky">
                <TextInput type="date" value={formular.datumPoptavky ?? ""} onChange={(e) => zmen("datumPoptavky", e.target.value)} />
              </Field>
              <Field label="Termín odevzdání">
                <TextInput type="date" value={formular.terminOdevzdani ?? ""} onChange={(e) => zmen("terminOdevzdani", e.target.value)} />
              </Field>
              <Field label="Datum předání">
                <TextInput type="date" value={formular.datumPredani ?? ""} onChange={(e) => zmen("datumPredani", e.target.value)} />
              </Field>
              <Field label="Revize dokumentace" hint="Označení revize, např. 02">
                <TextInput value={formular.revizeDokumentace ?? ""} onChange={(e) => zmen("revizeDokumentace", e.target.value)} />
              </Field>
              <Field label="Datum revize">
                <TextInput type="date" value={formular.datumRevize ?? ""} onChange={(e) => zmen("datumRevize", e.target.value)} />
              </Field>
              <Field label="Cena bez DPH (Kč)">
                <TextInput
                  type="number"
                  min={0}
                  value={String(formular.cenaBezDph ?? 0)}
                  onChange={(e) => zmen("cenaBezDph", Number(e.target.value))}
                />
              </Field>
            </div>

            <div className="mt-8 border-t border-line pt-5">
              <p className="section-label mb-4">Fakturace</p>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
                <Field label="Číslo faktury">
                  <TextInput value={formular.cisloFaktury ?? ""} onChange={(e) => zmen("cisloFaktury", e.target.value)} />
                </Field>
                <Field label="Datum fakturace">
                  <TextInput type="date" value={formular.datumFakturace ?? ""} onChange={(e) => zmen("datumFakturace", e.target.value)} />
                </Field>
                <Field label="Datum úhrady">
                  <TextInput type="date" value={formular.datumUhrady ?? ""} onChange={(e) => zmen("datumUhrady", e.target.value)} />
                </Field>
                <Field label="Fakturováno">
                  <Select value={formular.fakturovano ?? "Ne"} onChange={(e) => zmen("fakturovano", e.target.value)}>
                    {(ciselnik?.anoNe ?? ["Ano", "Ne"]).map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Zaplaceno">
                  <Select value={formular.zaplaceno ?? "Ne"} onChange={(e) => zmen("zaplaceno", e.target.value)}>
                    {(ciselnik?.anoNe ?? ["Ano", "Ne"]).map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Posouzení licence ERÚ">
                  <Select value={formular.posouzeniEru ?? "Ne"} onChange={(e) => zmen("posouzeniEru", e.target.value)}>
                    {(ciselnakAnoNe(ciselnik)).map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Předání provozní dokumentace">
                  <Select
                    value={formular.predaniProvozniDokumentace ?? "Ne"}
                    onChange={(e) => zmen("predaniProvozniDokumentace", e.target.value)}
                  >
                    {ciselnakAnoNe(ciselnik).map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Odkaz na složku na Disku" className="sm:col-span-2">
                  <TextInput value={formular.odkazNaSlozku ?? ""} onChange={(e) => zmen("odkazNaSlozku", e.target.value)} placeholder="https://drive.google.com/…" />
                </Field>
              </div>
            </div>

            <div className="mt-8">
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
                    Smazat záznam
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
        <Panel nadpis="Jak to funguje" popis="Rejstřík je obchodní evidence — generátor dokumentů se ho nedotýká.">
          <Poznamka>
            Zakázka založená v generátoru dokumentů se automaticky objeví i tady, aby se na ni nezapomnělo při
            fakturaci a při předání provozní dokumentace. Když zakázku v generátoru smažete, řádek v rejstříku
            zůstává — fakturační stopa se nemaže. Export „Stáhnout XLSX“ vytvoří sešit se stejnou strukturou, jakou
            má firemní soubor 13_Evidence_zakazek: listy Zakázky, Periodické revize a Číselník, včetně rozbalovacích
            seznamů a vzorců pro dopočet termínu revize.
          </Poznamka>
        </Panel>
      </div>
    </div>
  );
}

function ciselnakAnoNe(ciselnik: { anoNe: readonly string[] } | undefined): readonly string[] {
  return ciselnik?.anoNe ?? ["Ano", "Ne"];
}