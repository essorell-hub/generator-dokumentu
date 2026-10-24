import { useState } from "react";
import { useLocation } from "wouter";
import { Field, Select, TextInput, Tlacitko } from "../components/fields";
import { PrehledTerminu } from "../components/prehled";
import { PageTitle, PrazdnyStav, SectionTitle, StavBadge } from "../components/layout";
import { formatDatumCas } from "../lib/format";
import {
  useDalsiCislo,
  useKos,
  useObnovitZakazku,
  useSmazatTrvale,
  useVytvoritZakazku,
  useZakazky,
} from "../queries/zakazky";

export default function Zakazky() {
  const [, naviguj] = useLocation();
  const [hledat, setHledat] = useState("");
  const [stav, setStav] = useState("");
  const [nova, setNova] = useState(false);
  const [kosOtevreny, setKosOtevreny] = useState(false);

  const seznam = useZakazky(hledat, stav);
  const dalsi = useDalsiCislo();
  const vytvorit = useVytvoritZakazku();
  const kos = useKos();
  const obnovit = useObnovitZakazku();
  const smazatTrvale = useSmazatTrvale();

  const [cislo, setCislo] = useState("");
  const [nazevStavby, setNazevStavby] = useState("");
  const [investor, setInvestor] = useState("");
  const [adresaStavby, setAdresaStavby] = useState("");

  const otevritFormular = () => {
    setCislo(dalsi.data?.cislo ?? "");
    setNova(true);
  };

  const ulozit = async () => {
    const zakazka = await vytvorit.mutateAsync({
      cislo: cislo.trim() || (dalsi.data?.cislo ?? ""),
      nazevStavby,
      investor,
      adresaStavby,
      datum: dalsi.data?.datum,
      cisloZpravy: dalsi.data?.cisloZpravy,
      cisloNabidky: dalsi.data?.cisloNabidky,
      cisloDokumentu: dalsi.data?.cisloDokumentu,
      mistoPodpisu: dalsi.data?.mistoPodpisu,
    });
    if (zakazka) naviguj(`/zakazka/${zakazka.id}`);
  };

  return (
    <>
      <PageTitle podtitul="Zadejte zakázku, vyberte dokumenty a vygenerujte je do složky zakázky na Google Drive.">
        Zakázky
      </PageTitle>

      <PrehledTerminu />

      <div className="mb-8 flex flex-wrap items-end gap-4">
        <div className="min-w-[240px] flex-1">
          <Field label="Hledat">
            <TextInput
              value={hledat}
              onChange={(e) => setHledat(e.target.value)}
              placeholder="Číslo, název stavby, investor, katastr"
            />
          </Field>
        </div>
        <div className="w-[190px]">
          <Field label="Stav">
            <Select value={stav} onChange={(e) => setStav(e.target.value)}>
              <option value="">Všechny</option>
              <option value="rozpracovana">Rozpracované</option>
              <option value="vygenerovano">Vygenerované</option>
            </Select>
          </Field>
        </div>
        <Tlacitko onClick={otevritFormular} className="mb-[1px]">
          Nová zakázka
        </Tlacitko>
      </div>

      {nova ? (
        <section className="mb-10 border border-line bg-brick-wash/40 p-6">
          <SectionTitle hint="Ostatní údaje doplníte v detailu zakázky.">
            Nová zakázka
          </SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Číslo zakázky">
              <TextInput value={cislo} onChange={(e) => setCislo(e.target.value)} placeholder="2026-001" />
            </Field>
            <Field label="Název stavby">
              <TextInput
                value={nazevStavby}
                onChange={(e) => setNazevStavby(e.target.value)}
                placeholder="Rodinný dům Nová Ves"
              />
            </Field>
            <Field label="Investor / stavebník">
              <TextInput
                value={investor}
                onChange={(e) => setInvestor(e.target.value)}
                placeholder="Ing. Martin Dvořák"
              />
            </Field>
            <Field label="Adresa stavby">
              <TextInput
                value={adresaStavby}
                onChange={(e) => setAdresaStavby(e.target.value)}
                placeholder="Nová Ves 218, 739 11 Frýdlant nad Ostravicí"
              />
            </Field>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <Tlacitko onClick={ulozit} disabled={vytvorit.isPending}>
              {vytvorit.isPending ? "Ukládám…" : "Založit zakázku"}
            </Tlacitko>
            <Tlacitko varianta="text" onClick={() => setNova(false)}>
              Zrušit
            </Tlacitko>
            {vytvorit.isError ? (
              <span className="text-[13px] text-alert">{vytvorit.error.message}</span>
            ) : null}
          </div>
        </section>
      ) : null}

      {seznam.isLoading ? (
        <p className="text-ink-soft">Načítám…</p>
      ) : seznam.isError ? (
        <p className="text-alert">Zakázky se nepodařilo načíst: {seznam.error.message}</p>
      ) : !seznam.data?.length ? (
        <PrazdnyStav
          nadpis="Žádné zakázky"
          text="Zatím tu není ani jedna zakázka. Založte první a vygenerujte k ní dokumenty."
          akce={<Tlacitko onClick={otevritFormular}>Nová zakázka</Tlacitko>}
        />
      ) : (
        <table className="tabulka">
          <thead>
            <tr>
              <th className="w-[130px]">Číslo</th>
              <th>Stavba</th>
              <th>Investor</th>
              <th className="w-[130px]">Stav</th>
              <th className="w-[110px]">Dokumentů</th>
              <th className="w-[150px]">Upraveno</th>
            </tr>
          </thead>
          <tbody>
            {seznam.data.map((z) => (
              <tr
                key={z.id}
                className="cursor-pointer"
                onClick={() => naviguj(`/zakazka/${z.id}`)}
              >
                <td className="font-mono text-[13px] text-ink-soft">{z.cislo}</td>
                <td>
                  <span className="text-ink">{z.nazevStavby || "—"}</span>
                  {z.adresaStavby ? (
                    <span className="mt-[2px] block text-[12px] text-ink-soft">{z.adresaStavby}</span>
                  ) : null}
                </td>
                <td className="text-ink-soft">{z.investor || "—"}</td>
                <td>
                  <StavBadge stav={z.stav} />
                </td>
                <td className="text-ink-soft">{z.pocetDokumentu}</td>
                <td className="text-[13px] text-ink-soft">{formatDatumCas(z.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {kos.data?.length ? (
        <section className="mt-12 border-t border-line pt-6">
          <Tlacitko varianta="text" className="px-0" onClick={() => setKosOtevreny((o) => !o)}>
            Koš ({kos.data.length}) {kosOtevreny ? "▴" : "▾"}
          </Tlacitko>
          {kosOtevreny ? (
            <>
              <p className="mt-2 text-[13px] text-ink-soft">
                Smazané zakázky. Z koše je můžete obnovit i s dokumenty, nebo je smazat natrvalo.
              </p>
              <table className="tabulka mt-4">
                <thead>
                  <tr>
                    <th className="w-[130px]">Číslo</th>
                    <th>Stavba</th>
                    <th>Investor</th>
                    <th className="w-[150px]">Smazáno</th>
                    <th className="w-[230px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {kos.data.map((z) => (
                    <tr key={z.id}>
                      <td className="font-mono text-[13px] text-ink-soft">{z.cislo}</td>
                      <td className="text-ink">{z.nazevStavby || "—"}</td>
                      <td className="text-ink-soft">{z.investor || "—"}</td>
                      <td className="text-[13px] text-ink-soft">{formatDatumCas(z.smazanoAt)}</td>
                      <td className="text-right">
                        <Tlacitko
                          varianta="obrys"
                          disabled={obnovit.isPending}
                          onClick={() => obnovit.mutate({ id: z.id })}
                        >
                          Obnovit
                        </Tlacitko>{" "}
                        <Tlacitko
                          varianta="text"
                          className="text-alert"
                          disabled={smazatTrvale.isPending}
                          onClick={() => {
                            if (
                              !confirm(
                                `Smazat zakázku ${z.cislo} NATRVALO, včetně záznamů o jejích dokumentech? Toto už nejde vrátit.`,
                              )
                            )
                              return;
                            smazatTrvale.mutate({ id: z.id });
                          }}
                        >
                          Smazat natrvalo
                        </Tlacitko>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
