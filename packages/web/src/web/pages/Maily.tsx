import { useEffect, useState } from "react";
import { Field, Select, TextArea, TextInput, Tlacitko } from "@/components/fields";
import { Panel, Poznamka, Znak } from "@/components/agenda";
import { PageTitle, SectionTitle } from "@/components/layout";
import { formatDatumCas } from "@/lib/format";
import { useZakazky } from "@/queries/zakazky";
import {
  useHistorieZprav,
  useSablony,
  useSestavitMail,
  useSmazatSablonu,
  useSmazatZpravu,
  useUlozitSablonu,
  useZaznamenatZpravu,
  useZnacky,
} from "@/queries/agenda";
import type { client } from "@/lib/api";

type Sablona = Awaited<ReturnType<typeof client.maily.sablony>>[number];
type Zprava = Awaited<ReturnType<typeof client.maily.historie>>[number];

const PRAZDNA: Partial<Sablona> = { nazev: "", kategorie: "Obecné", predmet: "", telo: "" };

export default function Maily() {
  const { data: sablony } = useSablony();
  const { data: znacky } = useZnacky();
  const { data: zakazky } = useZakazky();
  const ulozit = useUlozitSablonu();
  const smazat = useSmazatSablonu();
  const sestavit = useSestavitMail();
  const zaznamenat = useZaznamenatZpravu();
  const smazatZpravu = useSmazatZpravu();

  const [zakazkaId, setZakazkaId] = useState<number | "">("");
  const [sablonaId, setSablonaId] = useState<number | "">("");
  const [komu, setKomu] = useState("");
  const [kopie, setKopie] = useState("");
  const [predmet, setPredmet] = useState("");
  const [telo, setTelo] = useState("");
  const [nevyplnene, setNevyplnene] = useState<string[]>([]);
  const [gmail, setGmail] = useState("");
  const [mailto, setMailto] = useState("");
  const [zkopirovano, setZkopirovano] = useState(false);
  const [upravovana, setUpravovana] = useState<Partial<Sablona> | null>(null);
  const [chyba, setChyba] = useState("");

  const { data: historie } = useHistorieZprav(
    zakazkaId === "" ? undefined : Number(zakazkaId),
  );

  // Při změně zakázky nebo šablony se e-mail sestaví znovu — vždy z uložené šablony,
  // aby se ruční úpravy nepřenesly omylem do další zprávy.
  useEffect(() => {
    if (zakazkaId === "" || sablonaId === "") return;
    let zruseno = false;
    sestavit
      .mutateAsync({ zakazkaId: Number(zakazkaId), sablonaId: Number(sablonaId) })
      .then((m) => {
        if (zruseno) return;
        setKomu(m.komu);
        setKopie(m.kopie);
        setPredmet(m.predmet);
        setTelo(m.telo);
        setNevyplnene(m.nevyplnene);
        setGmail(m.gmail);
        setMailto(m.mailto);
      })
      .catch(() => undefined);
    return () => {
      zruseno = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zakazkaId, sablonaId]);

  async function obnovitNahled() {
    if (zakazkaId === "" && sablonaId === "") return;
    const m = await sestavit.mutateAsync({
      zakazkaId: zakazkaId === "" ? undefined : Number(zakazkaId),
      sablonaId: sablonaId === "" ? undefined : Number(sablonaId),
      komu,
      kopie,
    });
    setPredmet(m.predmet);
    setTelo(m.telo);
    setNevyplnene(m.nevyplnene);
    setGmail(m.gmail);
    setMailto(m.mailto);
  }

  const vybranaSablona = (sablony ?? []).find((s) => s.id === sablonaId);

  return (
    <div>
      <PageTitle podtitul="Připravené e-mailové šablony a sestavení zprávy z dat zakázky. Aplikace zprávu předvyplní a otevře v Gmailu kanceláře — odešle ji až člověk.">
        E-maily
      </PageTitle>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1fr]">
        {/* ------------------------------------------------ sestavení zprávy */}
        <section>
          <SectionTitle hint="Vyberte zakázku a šablonu. Zástupné znaky se nahradí daty ze zakázky a z rejstříku.">
            Sestavit zprávu
          </SectionTitle>

          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <Field label="Zakázka">
              <Select value={String(zakazkaId)} onChange={(e) => setZakazkaId(e.target.value === "" ? "" : Number(e.target.value))}>
                <option value="">— vyberte —</option>
                {(zakazky ?? []).map((z) => (
                  <option key={z.id} value={String(z.id)}>
                    {z.cislo} · {z.nazevStavby || "bez názvu"}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Šablona">
              <Select value={String(sablonaId)} onChange={(e) => setSablonaId(e.target.value === "" ? "" : Number(e.target.value))}>
                <option value="">— vyberte —</option>
                {(sablony ?? []).map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.kategorie}: {s.nazev}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Komu">
              <TextInput value={komu} onChange={(e) => setKomu(e.target.value)} placeholder="jmeno@firma.cz" />
            </Field>
            <Field label="Kopie">
              <TextInput value={kopie} onChange={(e) => setKopie(e.target.value)} placeholder="nepovinné" />
            </Field>
            <Field label="Předmět" className="sm:col-span-2">
              <TextInput value={predmet} onChange={(e) => setPredmet(e.target.value)} />
            </Field>
          </div>

          <div className="mt-6">
            <Field label="Text zprávy">
              <TextArea value={telo} onChange={(e) => setTelo(e.target.value)} rows={16} className="font-mono text-[13px]" />
            </Field>
          </div>

          {nevyplnene.length > 0 ? (
            <p className="mt-4 border-l-2 border-amber bg-note-wash px-4 py-3 text-[13px] text-ink-soft">
              Nevyplněná místa: {nevyplnene.join(", ")}. Doplňte je ručně, nebo je vymažte — v zakázce pro ně
              nejsou data.
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Tlacitko
              onClick={() => {
                window.open(gmail, "_blank", "noopener");
                zaznamenat.mutate({
                  zakazkaId: zakazkaId === "" ? null : Number(zakazkaId),
                  sablonaId: sablonaId === "" ? null : Number(sablonaId),
                  sablonaNazev: vybranaSablona?.nazev ?? "Vlastní",
                  komu,
                  kopie,
                  predmet,
                  telo,
                  stav: "pripraveno",
                });
              }}
              disabled={!gmail || !predmet}
            >
              Otevřít v Gmailu
            </Tlacitko>
            <Tlacitko
              varianta="obrys"
              onClick={async () => {
                await navigator.clipboard.writeText(`${predmet}\n\n${telo}`);
                setZkopirovano(true);
                window.setTimeout(() => setZkopirovano(false), 2500);
              }}
            >
              {zkopirovano ? "Zkopírováno" : "Kopírovat text"}
            </Tlacitko>
            <a href={mailto} className="text-[13px] text-ink-soft underline hover:text-brick-deep">
              otevřít v poštovním klientu
            </a>
            <button onClick={obnovitNahled} className="ml-auto text-[13px] text-ink-soft hover:text-brick-deep">
              obnovit náhled ze šablony
            </button>
          </div>

          <div className="mt-8">
            <Panel nadpis="Historie zpráv" popis={zakazkaId === "" ? "Všechny připravené zprávy." : "Zprávy k vybrané zakázce."}>
              {(historie ?? []).length === 0 ? (
                <p className="py-4 text-[13px] text-ink-soft">Zatím žádná zpráva.</p>
              ) : (
                <ul className="divide-y divide-line border-y border-line">
                  {historie!.map((z: Zprava) => (
                    <li key={z.id} className="py-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[14px] text-ink">{z.predmet || "(bez předmětu)"}</p>
                          <p className="mt-1 text-[12px] text-ink-soft">
                            {z.sablonaNazev} · {z.komu || "bez adresáta"} · {formatDatumCas(z.createdAt)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <Znak ton={z.stav === "odeslano" ? "ok" : "info"}>{z.stav}</Znak>
                          <button onClick={() => smazatZpravu.mutate({ id: z.id })} className="text-[12px] text-ink-soft hover:text-alert">
                            smazat
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </section>

        {/* ------------------------------------------------------- šablony */}
        <section>
          <SectionTitle hint="Texty, které kancelář používá pořád dokola. Zástupné znaky se při sestavení nahradí.">
            Šablony
          </SectionTitle>

          <ul className="divide-y divide-line border-y border-line">
            {(sablony ?? []).map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-[14px] text-ink">{s.nazev}</p>
                  <p className="mt-1 truncate text-[12px] text-ink-soft">{s.predmet}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Znak>{s.kategorie}</Znak>
                  <button
                    onClick={() => {
                      setSablonaId(s.id);
                      if (zakazkaId === "") setZakazkaId((zakazky ?? [])[0]?.id ?? "");
                    }}
                    className="text-[12px] text-brick hover:text-brick-deep"
                  >
                    použít
                  </button>
                  <button onClick={() => setUpravovana({ ...s })} className="text-[12px] text-ink-soft hover:text-brick-deep">
                    upravit
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Tlacitko varianta="obrys" onClick={() => setUpravovana({ ...PRAZDNA })}>
              Nová šablona
            </Tlacitko>
          </div>

          <div className="mt-10">
            <Panel nadpis="Zástupné znaky">
              <ul className="divide-y divide-line border-y border-line">
                {(znacky ?? []).map((z) => (
                  <li key={z.znacka} className="flex items-baseline justify-between gap-6 py-2">
                    <code className="font-mono text-[12px] text-brick-deep">{z.znacka}</code>
                    <span className="flex-1 text-right text-[12px] text-ink-soft">{z.popis}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <div className="mt-10">
            <Poznamka>
              Aplikace zprávu nikdy neodešle sama. „Otevřít v Gmailu“ předvyplní koncept v účtu kanceláře a zprávu
              odešlete vy — v Gmailu pak zůstane v Odeslané poště. Připravená zpráva se zároveň zapíše do historie,
              takže je vidět, co se kdy komu chystalo. Přímé odesílání přes Gmail API je možné doplnit, až bude
              hotové přihlášení Google účtem (stejné jako u Drive).
            </Poznamka>
          </div>
        </section>
      </div>

      {/* ------------------------------------------------- modal: šablona */}
      {upravovana ? (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-charcoal/40 py-10">
          <div className="mx-auto max-w-[760px] border border-line bg-paper px-7 py-7">
            <header className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="section-label">{upravovana.id ? "Úprava šablony" : "Nová šablona"}</p>
                <h2 className="mt-2 text-[22px] text-brick-deep">{upravovana.nazev || "Šablona bez názvu"}</h2>
              </div>
              <button onClick={() => setUpravovana(null)} className="text-[13px] text-ink-soft hover:text-brick-deep">
                zavřít
              </button>
            </header>

            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <Field label="Název">
                <TextInput
                  value={upravovana.nazev ?? ""}
                  onChange={(e) => setUpravovana({ ...upravovana, nazev: e.target.value })}
                />
              </Field>
              <Field label="Kategorie">
                <TextInput
                  value={upravovana.kategorie ?? ""}
                  onChange={(e) => setUpravovana({ ...upravovana, kategorie: e.target.value })}
                />
              </Field>
              <Field label="Předmět" className="sm:col-span-2">
                <TextInput
                  value={upravovana.predmet ?? ""}
                  onChange={(e) => setUpravovana({ ...upravovana, predmet: e.target.value })}
                />
              </Field>
            </div>

            <div className="mt-6">
              <Field label="Text zprávy" hint="Použijte zástupné znaky, např. {{cislo}} nebo {{klient}}.">
                <TextArea
                  value={upravovana.telo ?? ""}
                  onChange={(e) => setUpravovana({ ...upravovana, telo: e.target.value })}
                  rows={18}
                  className="font-mono text-[13px]"
                />
              </Field>
            </div>

            {chyba ? <p className="mt-5 text-[13px] text-alert">{chyba}</p> : null}

            <footer className="mt-8 flex items-center justify-between gap-4 border-t border-line pt-5">
              <div>
                {upravovana.id ? (
                  <Tlacitko
                    varianta="text"
                    onClick={async () => {
                      await smazat.mutateAsync({ id: upravovana.id as number });
                      setUpravovana(null);
                    }}
                  >
                    Smazat šablonu
                  </Tlacitko>
                ) : null}
              </div>
              <div className="flex gap-3">
                <Tlacitko varianta="obrys" onClick={() => setUpravovana(null)}>
                  Zrušit
                </Tlacitko>
                <Tlacitko
                  disabled={ulozit.isPending}
                  onClick={async () => {
                    if (!upravovana.nazev?.trim()) {
                      setChyba("Název šablony je povinný.");
                      return;
                    }
                    setChyba("");
                    await ulozit.mutateAsync({
                      id: upravovana.id,
                      nazev: upravovana.nazev ?? "",
                      kategorie: upravovana.kategorie || "Obecné",
                      predmet: upravovana.predmet ?? "",
                      telo: upravovana.telo ?? "",
                      poradi: upravovana.poradi ?? 0,
                    });
                    setUpravovana(null);
                  }}
                >
                  Uložit
                </Tlacitko>
              </div>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
