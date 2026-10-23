import { useState, type ReactNode } from "react";
import { Check, Field, Select, TextArea, TextInput, Tlacitko } from "@/components/fields";
import { Metrika, Metriky, Panel, Poznamka, Stahnout, Znak, tonStavu } from "@/components/agenda";
import { PageTitle } from "@/components/layout";
import { formatDatumIso } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { client } from "@/lib/api";
import {
  useMeridla,
  useOpravneni,
  useOsoby,
  useProvozCiselniky,
  useProvozUpozorneni,
  useSmazatMeridlo,
  useSmazatOpravneni,
  useSmazatOsobu,
  useUlozitMeridlo,
  useUlozitOpravneni,
  useUlozitOsobu,
} from "@/queries/provoz";

type Osoba = Awaited<ReturnType<typeof client.provoz.osoby>>[number];
type Meridlo = Awaited<ReturnType<typeof client.provoz.meridla>>[number];
type Opravneni = Awaited<ReturnType<typeof client.provoz.opravneni>>[number];

const NOVA_OSOBA: Partial<Osoba> = { stupen: "elektrotechnik", aktivni: true };
const NOVE_MERIDLO: Partial<Meridlo> = { intervalMesicu: 12, aktivni: true };

const LHUTY = [
  {
    co: "Školení osob o předpisech k zajištění bezpečnosti práce",
    kolik: "podle vnitřního předpisu, jinak nejméně 1× ročně",
    zdroj: "§ 3 odst. 4 NV č. 194/2022 Sb.",
  },
  {
    co: "Doklad o odborné způsobilosti (elektrotechnik, vedoucí elektrotechnik)",
    kolik: "3 roky",
    zdroj: "NV č. 194/2022 Sb.",
  },
  {
    co: "Osvědčení revizního technika",
    kolik: "5 let",
    zdroj: "zák. č. 250/2021 Sb., vydává TIČR",
  },
  {
    co: "Oprávnění právnické osoby / podnikající fyzické osoby od TIČR",
    kolik: "podle data na oprávnění",
    zdroj: "zák. č. 250/2021 Sb.",
  },
  {
    co: "Kalibrace měřicích přístrojů pro revize",
    kolik: "obvykle 12 měsíců",
    zdroj: "doporučení výrobce; měřidla se uvádějí ve zprávě o revizi (§ 10 odst. 1 písm. g) NV č. 190/2022 Sb.)",
  },
  {
    co: "Lékařská prohlídka (pracovnělékařské služby)",
    kolik: "podle posudku lékaře",
    zdroj: "zák. č. 373/2011 Sb., vyhl. č. 79/2013 Sb.",
  },
];

/** Datum lhůty s barvou podle stavu — řádek se dá přečíst bez štítků. */
function DatumLhuty({ datum, stav }: { datum: string | null | undefined; stav?: string }) {
  if (!datum) return <span className="text-ink-soft">—</span>;
  return (
    <span
      className={cn(
        "whitespace-nowrap",
        stav === "Prošlé" && "text-alert",
        stav === "Blíží se" && "text-[#a9741f]",
      )}
    >
      {formatDatumIso(datum)}
    </span>
  );
}

function Akce({ onUpravit, onSmazat }: { onUpravit: () => void; onSmazat: () => void }) {
  return (
    <div className="flex justify-end gap-3 text-[12px]">
      <button onClick={onUpravit} className="text-brick hover:text-brick-deep">
        upravit
      </button>
      <button onClick={onSmazat} className="text-ink-soft hover:text-alert">
        smazat
      </button>
    </div>
  );
}

/** Modální formulář — stejná kostra pro osoby, měřidla i oprávnění. */
function Okno({
  stitek,
  titul,
  chyba,
  pending,
  onZavrit,
  onUlozit,
  onSmazat,
  children,
}: {
  stitek: string;
  titul: string;
  chyba: string;
  pending: boolean;
  onZavrit: () => void;
  onUlozit: () => void;
  onSmazat?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-charcoal/40 py-10">
      <div className="mx-auto max-w-[760px] border border-line bg-paper px-7 py-7">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="section-label">{stitek}</p>
            <h2 className="mt-2 text-[22px] text-brick-deep">{titul}</h2>
          </div>
          <button onClick={onZavrit} className="text-[13px] text-ink-soft hover:text-brick-deep">
            zavřít
          </button>
        </header>
        {children}
        {chyba ? <p className="mt-5 text-[13px] text-alert">{chyba}</p> : null}
        <footer className="mt-8 flex items-center justify-between gap-4 border-t border-line pt-5">
          <div>
            {onSmazat ? (
              <Tlacitko varianta="text" onClick={onSmazat}>
                Smazat
              </Tlacitko>
            ) : null}
          </div>
          <div className="flex gap-3">
            <Tlacitko varianta="obrys" onClick={onZavrit}>
              Zrušit
            </Tlacitko>
            <Tlacitko onClick={onUlozit} disabled={pending}>
              Uložit
            </Tlacitko>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Prazdne({ text }: { text: string }) {
  return <p className="border-y border-line py-8 text-center text-[13px] text-ink-soft">{text}</p>;
}

function Datum({ value, onChange }: { value: string | null | undefined; onChange: (v: string) => void }) {
  return <TextInput type="date" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
}

export default function Provoz() {
  const cis = useProvozCiselniky();
  const upo = useProvozUpozorneni();
  const osoby = useOsoby();
  const meridla = useMeridla();
  const opravneni = useOpravneni();

  const ulozitOsobu = useUlozitOsobu();
  const smazatOsobu = useSmazatOsobu();
  const ulozitMeridlo = useUlozitMeridlo();
  const smazatMeridlo = useSmazatMeridlo();
  const ulozitOpravneni = useUlozitOpravneni();
  const smazatOpravneni = useSmazatOpravneni();

  const [osoba, setOsoba] = useState<Partial<Osoba> | null>(null);
  const [meridlo, setMeridlo] = useState<Partial<Meridlo> | null>(null);
  const [opr, setOpr] = useState<Partial<Opravneni> | null>(null);
  const [chyba, setChyba] = useState("");

  const seznamOsob = osoby.data ?? [];
  const seznamMeridel = meridla.data ?? [];
  const seznamOpravneni = opravneni.data ?? [];
  const lhuty = upo.data ?? [];
  const proslych = lhuty.filter((l) => l.stav === "Prošlé").length;
  const blizicich = lhuty.filter((l) => l.stav === "Blíží se").length;

  const zavrit = () => {
    setOsoba(null);
    setMeridlo(null);
    setOpr(null);
    setChyba("");
  };

  async function ulozOsobu() {
    if (!osoba) return;
    if (!osoba.jmeno?.trim()) return setChyba("Vyplňte jméno a příjmení.");
    await ulozitOsobu.mutateAsync({
      id: osoba.id,
      jmeno: osoba.jmeno,
      funkce: osoba.funkce ?? "",
      stupen: osoba.stupen ?? "elektrotechnik",
      rozsah: osoba.rozsah ?? "",
      cisloDokladu: osoba.cisloDokladu ?? "",
      dokladPlatnostDo: osoba.dokladPlatnostDo ?? "",
      skoleniPosledni: osoba.skoleniPosledni ?? "",
      zdravotniPosledni: osoba.zdravotniPosledni ?? "",
      zdravotniPristi: osoba.zdravotniPristi ?? "",
      datumNarozeni: osoba.datumNarozeni ?? "",
      telefon: osoba.telefon ?? "",
      email: osoba.email ?? "",
      aktivni: osoba.aktivni ?? true,
      poznamka: osoba.poznamka ?? "",
    });
    zavrit();
  }

  async function ulozMeridlo() {
    if (!meridlo) return;
    if (!meridlo.nazev?.trim()) return setChyba("Vyplňte název přístroje.");
    await ulozitMeridlo.mutateAsync({
      id: meridlo.id,
      nazev: meridlo.nazev,
      vyrobce: meridlo.vyrobce ?? "",
      typ: meridlo.typ ?? "",
      vyrobniCislo: meridlo.vyrobniCislo ?? "",
      kalibracniList: meridlo.kalibracniList ?? "",
      kalibraceDatum: meridlo.kalibraceDatum ?? "",
      intervalMesicu: Math.min(120, Math.max(1, Number(meridlo.intervalMesicu) || 12)),
      kalibroval: meridlo.kalibroval ?? "",
      aktivni: meridlo.aktivni ?? true,
      poznamka: meridlo.poznamka ?? "",
    });
    zavrit();
  }

  async function ulozOpravneni() {
    if (!opr) return;
    if (!opr.druh?.trim()) return setChyba("Vyberte druh oprávnění.");
    await ulozitOpravneni.mutateAsync({
      id: opr.id,
      druh: opr.druh,
      cislo: opr.cislo ?? "",
      rozsah: opr.rozsah ?? "",
      vydal: opr.vydal ?? "",
      platnostOd: opr.platnostOd ?? "",
      platnostDo: opr.platnostDo ?? "",
      poznamka: opr.poznamka ?? "",
    });
    zavrit();
  }

  const zO = (k: keyof Osoba, v: unknown) => setOsoba((f) => (f ? { ...f, [k]: v } : f));
  const zM = (k: keyof Meridlo, v: unknown) => setMeridlo((f) => (f ? { ...f, [k]: v } : f));
  const zP = (k: keyof Opravneni, v: unknown) => setOpr((f) => (f ? { ...f, [k]: v } : f));

  return (
    <div>
      <PageTitle podtitul="Odborná způsobilost osob, kalibrace měřidel a oprávnění firmy na jednom místě. Údaje se zároveň propisují do generovaných dokumentů — zprávy o revizi, pověření, záznamu o školení.">
        Provoz kanceláře
      </PageTitle>

      <Metriky>
        <Metrika
          popisek="Osoby"
          hodnota={seznamOsob.filter((o) => o.aktivni).length}
          doplneni={`aktivních z ${seznamOsob.length}`}
        />
        <Metrika
          popisek="Měřidla"
          hodnota={seznamMeridel.filter((m) => m.aktivni).length}
          doplneni="v používání"
        />
        <Metrika popisek="Oprávnění" hodnota={seznamOpravneni.length} doplneni="osvědčení, pojištění" />
        <Metrika popisek="Prošlé lhůty" hodnota={proslych} doplneni="k okamžitému řešení" ton="pozor" />
        <Metrika popisek="Blíží se" hodnota={blizicich} doplneni="do 60 dnů" ton="blizi" />
      </Metriky>

      <div className="mb-12 flex flex-wrap items-center gap-3">
        <p className="text-[13px] text-ink-soft">
          Export obsahuje osoby, měřidla, oprávnění a provozní deník; lhůty jsou v něm vzorce, takže se
          přepočítávají i offline.
        </p>
        <div className="ml-auto">
          <Stahnout href="/api/soubory/provoz.xlsx">Stáhnout XLSX</Stahnout>
        </div>
      </div>

      <Panel
        nadpis="Co je potřeba řešit"
        popis="Prošlé a blížící se lhůty napříč osobami, měřidly a oprávněními, seřazené od nejnaléhavější."
      >
        {upo.isLoading ? (
          <p className="py-6 text-ink-soft">Načítám…</p>
        ) : lhuty.length === 0 ? (
          <Prazdne text="Žádná lhůta neprošla ani se neblíží. Chybějící data se tu neukazují — zkontrolujte je v tabulkách níže." />
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {lhuty.map((l, i) => (
              <li key={i} className="grid grid-cols-[90px_1fr_110px_80px_90px] items-baseline gap-4 py-3">
                <span className="text-[11px] tracking-[0.1em] text-ink-soft uppercase">{l.kde}</span>
                <span className="text-[14px]">
                  {l.kdo || "—"}
                  <span className="ml-2 text-[12px] text-ink-soft">{l.co}</span>
                </span>
                <span className="text-[13px]">
                  <DatumLhuty datum={l.datum} stav={l.stav} />
                </span>
                <span className="text-right text-[13px] tabular-nums">
                  {l.dni === null ? "—" : l.dni < 0 ? `${-l.dni} dní po` : `za ${l.dni} dní`}
                </span>
                <span className="text-right">
                  <Znak ton={tonStavu(l.stav)}>{l.stav}</Znak>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* Osoby */}
      <div className="mt-14">
        <Panel
          nadpis="Osoby a odborná způsobilost"
          popis="Stupeň podle NV č. 194/2022 Sb., rozsah revizního technika podle přílohy č. 5 NV č. 190/2022 Sb. Revizní technik z tohoto seznamu se doplní do zprávy o revizi."
          pravo={<Tlacitko onClick={() => setOsoba({ ...NOVA_OSOBA })}>Přidat osobu</Tlacitko>}
        >
          {osoby.isLoading ? (
            <p className="py-6 text-ink-soft">Načítám…</p>
          ) : seznamOsob.length === 0 ? (
            <Prazdne text="Zatím žádná osoba. Zapište alespoň revizního technika — jeho jméno a číslo osvědčení se pak doplní do dokumentů." />
          ) : (
            <div className="overflow-x-auto">
              <table className="tabulka">
                <thead>
                  <tr>
                    <th>Jméno / funkce</th>
                    <th className="w-[170px]">Stupeň / rozsah</th>
                    <th className="w-[160px]">Doklad / platnost</th>
                    <th className="w-[110px]">Příští školení</th>
                    <th className="w-[110px]">Lékařská prohl.</th>
                    <th className="w-[100px]">Stav</th>
                    <th className="w-[100px]" />
                  </tr>
                </thead>
                <tbody>
                  {seznamOsob.map((o) => {
                    const st = (co: string) => o.lhuty.find((l) => l.co.startsWith(co))?.stav;
                    return (
                      <tr key={o.id} className={cn(!o.aktivni && "opacity-55")}>
                        <td>
                          <button onClick={() => setOsoba({ ...o })} className="text-left hover:text-brick">
                            {o.jmeno}
                          </button>
                          {o.funkce ? (
                            <span className="mt-1 block text-[12px] text-ink-soft">{o.funkce}</span>
                          ) : null}
                        </td>
                        <td className="text-[13px]">
                          {o.stupen}
                          {o.rozsah ? <span className="ml-2 text-ink-soft">{o.rozsah}</span> : null}
                        </td>
                        <td className="text-[13px]">
                          {o.cisloDokladu || <span className="text-ink-soft">—</span>}
                          <span className="mt-1 block text-[12px]">
                            <DatumLhuty datum={o.dokladPlatnostDo} stav={st("Doklad")} />
                          </span>
                        </td>
                        <td className="text-[13px]">
                          <DatumLhuty datum={o.skoleniPristi} stav={st("Školení")} />
                        </td>
                        <td className="text-[13px]">
                          <DatumLhuty datum={o.zdravotniPristi} stav={st("Zdravotní")} />
                        </td>
                        <td>
                          <Znak ton={tonStavu(o.stav)}>{o.stav}</Znak>
                        </td>
                        <td>
                          <Akce onUpravit={() => setOsoba({ ...o })} onSmazat={() => smazatOsobu.mutate({ id: o.id })} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      {/* Měřidla */}
      <div className="mt-14">
        <Panel
          nadpis="Měřicí přístroje a kalibrace"
          popis="Zpráva o revizi musí obsahovat soupis použitých měřicích přístrojů (§ 10 odst. 1 písm. g) NV č. 190/2022 Sb.). Aktivní přístroje se do ní vypíší samy."
          pravo={<Tlacitko onClick={() => setMeridlo({ ...NOVE_MERIDLO })}>Přidat měřidlo</Tlacitko>}
        >
          {meridla.isLoading ? (
            <p className="py-6 text-ink-soft">Načítám…</p>
          ) : seznamMeridel.length === 0 ? (
            <Prazdne text="Zatím žádný přístroj. Zapište měřidla, kterými revidujete, včetně čísla kalibračního listu." />
          ) : (
            <div className="overflow-x-auto">
              <table className="tabulka">
                <thead>
                  <tr>
                    <th>Přístroj</th>
                    <th className="w-[120px]">Výrobní č.</th>
                    <th className="w-[130px]">Kalibrační list</th>
                    <th className="w-[110px]">Kalibrováno</th>
                    <th className="w-[110px]">Platnost do</th>
                    <th className="w-[70px] text-right">Dní</th>
                    <th className="w-[100px]">Stav</th>
                    <th className="w-[100px]" />
                  </tr>
                </thead>
                <tbody>
                  {seznamMeridel.map((m) => (
                    <tr key={m.id} className={cn(!m.aktivni && "opacity-55")}>
                      <td>
                        <button onClick={() => setMeridlo({ ...m })} className="text-left hover:text-brick">
                          {m.nazev}
                        </button>
                        {m.vyrobce || m.typ ? (
                          <span className="mt-1 block text-[12px] text-ink-soft">
                            {[m.vyrobce, m.typ].filter(Boolean).join(" · ")}
                          </span>
                        ) : null}
                      </td>
                      <td className="text-[13px]">{m.vyrobniCislo || "—"}</td>
                      <td className="text-[13px]">{m.kalibracniList || "—"}</td>
                      <td className="text-[13px]">
                        <DatumLhuty datum={m.kalibraceDatum} />
                      </td>
                      <td className="text-[13px]">
                        <DatumLhuty datum={m.kalibracePlatnost} stav={m.stav} />
                        <span className="mt-1 block text-[11px] text-ink-soft">po {m.intervalMesicu} měs.</span>
                      </td>
                      <td className="text-right text-[13px] tabular-nums">{m.dni ?? "—"}</td>
                      <td>
                        <Znak ton={tonStavu(m.stav)}>{m.stav}</Znak>
                      </td>
                      <td>
                        <Akce onUpravit={() => setMeridlo({ ...m })} onSmazat={() => smazatMeridlo.mutate({ id: m.id })} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      {/* Oprávnění */}
      <div className="mt-14">
        <Panel
          nadpis="Oprávnění a osvědčení firmy"
          popis="Oprávnění TIČR, živnostenské oprávnění, pojištění odpovědnosti a další doklady, které klient nebo kontrola může chtít vidět."
          pravo={
            <Tlacitko onClick={() => setOpr({ druh: cis.data?.druhyOpravneni[0] ?? "" })}>Přidat oprávnění</Tlacitko>
          }
        >
          {opravneni.isLoading ? (
            <p className="py-6 text-ink-soft">Načítám…</p>
          ) : seznamOpravneni.length === 0 ? (
            <Prazdne text="Zatím žádné oprávnění. Zapište oprávnění TIČR a pojištění — číslo oprávnění se uvádí v dokumentech." />
          ) : (
            <div className="overflow-x-auto">
              <table className="tabulka">
                <thead>
                  <tr>
                    <th>Druh</th>
                    <th className="w-[140px]">Číslo</th>
                    <th className="w-[160px]">Rozsah</th>
                    <th className="w-[110px]">Platnost do</th>
                    <th className="w-[70px] text-right">Dní</th>
                    <th className="w-[110px]">Stav</th>
                    <th className="w-[100px]" />
                  </tr>
                </thead>
                <tbody>
                  {seznamOpravneni.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <button onClick={() => setOpr({ ...p })} className="text-left hover:text-brick">
                          {p.druh}
                        </button>
                        {p.vydal ? <span className="mt-1 block text-[12px] text-ink-soft">{p.vydal}</span> : null}
                      </td>
                      <td className="text-[13px]">{p.cislo || "—"}</td>
                      <td className="text-[13px]">{p.rozsah || "—"}</td>
                      <td className="text-[13px]">
                        <DatumLhuty datum={p.platnostDo} stav={p.stav} />
                      </td>
                      <td className="text-right text-[13px] tabular-nums">{p.dni ?? "—"}</td>
                      <td>
                        <Znak ton={tonStavu(p.stav)}>{p.stav}</Znak>
                      </td>
                      <td>
                        <Akce onUpravit={() => setOpr({ ...p })} onSmazat={() => smazatOpravneni.mutate({ id: p.id })} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      {/* Lhůty — přehled */}
      <div className="mt-14">
        <Panel nadpis="Lhůty, které stránka hlídá">
          <ul className="divide-y divide-line border-y border-line">
            {LHUTY.map((l) => (
              <li key={l.co} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[1fr_200px_1fr] sm:gap-6">
                <span className="text-[14px]">{l.co}</span>
                <span className="text-[13px] text-brick-deep">{l.kolik}</span>
                <span className="text-[12px] text-ink-soft">{l.zdroj}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <Poznamka>
              „Blíží se“ znamená 60 dnů nebo méně do konce platnosti. Příští školení se počítá jako poslední
              školení + 12 měsíců (zákonné minimum bez vnitřního předpisu), platnost kalibrace jako datum kalibrace + zvolený interval. U lékařské
              prohlídky a dokladů se bere datum, které zapíšete — lhůtu určuje lékař, resp. vydavatel dokladu.
              Neaktivní osoby a přístroje se do upozornění ani do dokumentů nepropisují.
            </Poznamka>
          </div>
        </Panel>
      </div>

      {osoba ? (
        <Okno
          stitek={osoba.id ? "Úprava osoby" : "Nová osoba"}
          titul={osoba.jmeno || "Jméno a příjmení"}
          chyba={chyba}
          pending={ulozitOsobu.isPending}
          onZavrit={zavrit}
          onUlozit={ulozOsobu}
          onSmazat={
            osoba.id
              ? async () => {
                  await smazatOsobu.mutateAsync({ id: osoba.id as number });
                  zavrit();
                }
              : undefined
          }
        >
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <Field label="Jméno a příjmení, titul">
              <TextInput value={osoba.jmeno ?? ""} onChange={(e) => zO("jmeno", e.target.value)} />
            </Field>
            <Field label="Funkce" hint="např. revizní technik, projektant, vedoucí práce">
              <TextInput value={osoba.funkce ?? ""} onChange={(e) => zO("funkce", e.target.value)} />
            </Field>
            <Field label="Stupeň odborné způsobilosti">
              <Select value={osoba.stupen ?? "elektrotechnik"} onChange={(e) => zO("stupen", e.target.value)}>
                {(cis.data?.stupne ?? []).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Rozsah (příloha č. 5 NV 190/2022)" hint="E1 NN a VN · E2 do 1 kV AC / 1,5 kV DC · E3 jen ochrana před bleskem; A bez, B s nebezpečím výbuchu">
              <Select value={osoba.rozsah ?? ""} onChange={(e) => zO("rozsah", e.target.value)}>
                <option value="">— neurčeno —</option>
                {(cis.data?.rozsahy ?? []).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Číslo dokladu / osvědčení">
              <TextInput value={osoba.cisloDokladu ?? ""} onChange={(e) => zO("cisloDokladu", e.target.value)} />
            </Field>
            <Field label="Platnost dokladu do" hint="osvědčení RT 5 let, doklad elektrotechnika 3 roky">
              <Datum value={osoba.dokladPlatnostDo} onChange={(v) => zO("dokladPlatnostDo", v)} />
            </Field>
            <Field label="Poslední školení" hint="příští se dopočítá (+12 měsíců)">
              <Datum value={osoba.skoleniPosledni} onChange={(v) => zO("skoleniPosledni", v)} />
            </Field>
            <Field label="Datum narození" hint="uvádí se v záznamu o školení">
              <Datum value={osoba.datumNarozeni} onChange={(v) => zO("datumNarozeni", v)} />
            </Field>
            <Field label="Poslední lékařská prohlídka">
              <Datum value={osoba.zdravotniPosledni} onChange={(v) => zO("zdravotniPosledni", v)} />
            </Field>
            <Field label="Příští lékařská prohlídka" hint="podle posudku o zdravotní způsobilosti">
              <Datum value={osoba.zdravotniPristi} onChange={(v) => zO("zdravotniPristi", v)} />
            </Field>
            <Field label="Telefon">
              <TextInput value={osoba.telefon ?? ""} onChange={(e) => zO("telefon", e.target.value)} />
            </Field>
            <Field label="E-mail">
              <TextInput value={osoba.email ?? ""} onChange={(e) => zO("email", e.target.value)} />
            </Field>
          </div>
          <div className="mt-4">
            <Check
              label="Aktivní"
              hint="Neaktivní osoba zůstane v evidenci, ale nehlídá se a nepropisuje do dokumentů."
              checked={osoba.aktivni ?? true}
              onChange={(e) => zO("aktivni", e.target.checked)}
            />
          </div>
          <div className="mt-4">
            <Field label="Poznámka">
              <TextArea value={osoba.poznamka ?? ""} onChange={(e) => zO("poznamka", e.target.value)} rows={3} />
            </Field>
          </div>
        </Okno>
      ) : null}

      {meridlo ? (
        <Okno
          stitek={meridlo.id ? "Úprava měřidla" : "Nové měřidlo"}
          titul={meridlo.nazev || "Název přístroje"}
          chyba={chyba}
          pending={ulozitMeridlo.isPending}
          onZavrit={zavrit}
          onUlozit={ulozMeridlo}
          onSmazat={
            meridlo.id
              ? async () => {
                  await smazatMeridlo.mutateAsync({ id: meridlo.id as number });
                  zavrit();
                }
              : undefined
          }
        >
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <Field label="Název přístroje" hint="např. multifunkční přístroj pro revize">
              <TextInput value={meridlo.nazev ?? ""} onChange={(e) => zM("nazev", e.target.value)} />
            </Field>
            <Field label="Výrobce">
              <TextInput value={meridlo.vyrobce ?? ""} onChange={(e) => zM("vyrobce", e.target.value)} />
            </Field>
            <Field label="Typ">
              <TextInput value={meridlo.typ ?? ""} onChange={(e) => zM("typ", e.target.value)} />
            </Field>
            <Field label="Výrobní číslo">
              <TextInput value={meridlo.vyrobniCislo ?? ""} onChange={(e) => zM("vyrobniCislo", e.target.value)} />
            </Field>
            <Field label="Číslo kalibračního listu">
              <TextInput value={meridlo.kalibracniList ?? ""} onChange={(e) => zM("kalibracniList", e.target.value)} />
            </Field>
            <Field label="Kalibroval" hint="kalibrační laboratoř">
              <TextInput value={meridlo.kalibroval ?? ""} onChange={(e) => zM("kalibroval", e.target.value)} />
            </Field>
            <Field label="Datum kalibrace">
              <Datum value={meridlo.kalibraceDatum} onChange={(v) => zM("kalibraceDatum", v)} />
            </Field>
            <Field label="Interval kalibrace (měsíce)" hint="obvykle 12">
              <TextInput
                type="number"
                min={1}
                max={120}
                value={String(meridlo.intervalMesicu ?? 12)}
                onChange={(e) => zM("intervalMesicu", e.target.value)}
              />
            </Field>
          </div>
          <div className="mt-4">
            <Check
              label="V používání"
              hint="Jen přístroje v používání se vypisují do zprávy o revizi."
              checked={meridlo.aktivni ?? true}
              onChange={(e) => zM("aktivni", e.target.checked)}
            />
          </div>
          <div className="mt-4">
            <Field label="Poznámka">
              <TextArea value={meridlo.poznamka ?? ""} onChange={(e) => zM("poznamka", e.target.value)} rows={3} />
            </Field>
          </div>
        </Okno>
      ) : null}

      {opr ? (
        <Okno
          stitek={opr.id ? "Úprava oprávnění" : "Nové oprávnění"}
          titul={opr.druh || "Oprávnění"}
          chyba={chyba}
          pending={ulozitOpravneni.isPending}
          onZavrit={zavrit}
          onUlozit={ulozOpravneni}
          onSmazat={
            opr.id
              ? async () => {
                  await smazatOpravneni.mutateAsync({ id: opr.id as number });
                  zavrit();
                }
              : undefined
          }
        >
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <Field label="Druh" className="sm:col-span-2">
              <Select value={opr.druh ?? ""} onChange={(e) => zP("druh", e.target.value)}>
                {(cis.data?.druhyOpravneni ?? []).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Číslo">
              <TextInput value={opr.cislo ?? ""} onChange={(e) => zP("cislo", e.target.value)} />
            </Field>
            <Field label="Vydal">
              <TextInput value={opr.vydal ?? ""} onChange={(e) => zP("vydal", e.target.value)} />
            </Field>
            <Field label="Rozsah" className="sm:col-span-2" hint="u TIČR rozlišovací znaky přílohy č. 3 NV 190/2022 a činnosti M · O · R · Z (např. E2A M O R Z); u pojištění částka">
              <TextInput value={opr.rozsah ?? ""} onChange={(e) => zP("rozsah", e.target.value)} />
            </Field>
            <Field label="Platnost od">
              <Datum value={opr.platnostOd} onChange={(v) => zP("platnostOd", v)} />
            </Field>
            <Field label="Platnost do" hint="prázdné = bez omezení">
              <Datum value={opr.platnostDo} onChange={(v) => zP("platnostDo", v)} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Poznámka">
              <TextArea value={opr.poznamka ?? ""} onChange={(e) => zP("poznamka", e.target.value)} rows={3} />
            </Field>
          </div>
        </Okno>
      ) : null}
    </div>
  );
}
