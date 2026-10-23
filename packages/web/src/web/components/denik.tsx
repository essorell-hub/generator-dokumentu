import { useState } from "react";
import { Field, Select, TextArea, TextInput, Tlacitko } from "@/components/fields";
import { Znak } from "@/components/agenda";
import { formatDatumIso } from "@/lib/format";
import type { client } from "@/lib/api";
import {
  useProhlidky,
  useProvozCiselniky,
  useSmazatProhlidku,
  useUlozitProhlidku,
} from "@/queries/provoz";

type Zaznam = Awaited<ReturnType<typeof client.provoz.prohlidky>>[number];
type Formular = Partial<Zaznam>;

const dnes = () => new Date().toISOString().slice(0, 10);

/**
 * Provozní deník VEZ u zakázky — prohlídky, zkoušky, údržba, opravy
 * a mimořádné události podle řádu prohlídek (§ 7 odst. 5 NV č. 190/2022 Sb.).
 * Záznamy se propisují do dokumentu P11 Provozní deník.
 */
export function ProvozniDenik({ zakazkaId }: { zakazkaId: number }) {
  const { data, isLoading } = useProhlidky(zakazkaId);
  const cis = useProvozCiselniky();
  const ulozit = useUlozitProhlidku();
  const smazat = useSmazatProhlidku();
  const [f, setF] = useState<Formular | null>(null);
  const [chyba, setChyba] = useState("");

  const zaznamy = data ?? [];
  const otevrenych = zaznamy.filter((z) => z.zavada.trim() && !z.odstraneno.trim()).length;
  const zmen = (k: keyof Zaznam, v: string) => setF((x) => (x ? { ...x, [k]: v } : x));
  const zavrit = () => {
    setF(null);
    setChyba("");
  };

  async function uloz() {
    if (!f) return;
    if (!f.datum) return setChyba("Vyplňte datum úkonu.");
    await ulozit.mutateAsync({
      id: f.id,
      zakazkaId,
      datum: f.datum,
      druh: f.druh ?? "Prohlídka",
      rozsah: f.rozsah ?? "",
      provedl: f.provedl ?? "",
      vysledek: f.vysledek ?? "",
      zavada: f.zavada ?? "",
      odstraneno: f.odstraneno ?? "",
      poznamka: f.poznamka ?? "",
    });
    zavrit();
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-4">
        <p className="text-[13px] text-ink-soft">
          {zaznamy.length
            ? `${zaznamy.length} ${zaznamy.length === 1 ? "záznam" : zaznamy.length <= 4 ? "záznamy" : "záznamů"}${otevrenych ? ` · neodstraněné závady: ${otevrenych}` : ""}`
            : "Zatím bez záznamů."}
        </p>
        {otevrenych ? <Znak ton="pozor">Otevřené závady</Znak> : null}
        <div className="ml-auto">
          <Tlacitko varianta="obrys" onClick={() => setF({ datum: dnes(), druh: "Prohlídka" })}>
            Přidat záznam
          </Tlacitko>
        </div>
      </div>

      {isLoading ? (
        <p className="py-6 text-ink-soft">Načítám…</p>
      ) : zaznamy.length === 0 ? (
        <p className="border-y border-line py-8 text-center text-[13px] text-ink-soft">
          Zapisujte prohlídky, zkoušky, údržbu a opravy zařízení. Bez záznamů vygeneruje P11 prázdný deník k ručnímu
          vyplňování.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="tabulka">
            <thead>
              <tr>
                <th className="w-[105px]">Datum</th>
                <th className="w-[120px]">Úkon</th>
                <th>Rozsah a výsledek</th>
                <th className="w-[220px]">Závada / odstranění</th>
                <th className="w-[130px]">Provedl</th>
                <th className="w-[100px]" />
              </tr>
            </thead>
            <tbody>
              {zaznamy.map((z) => (
                <tr key={z.id}>
                  <td className="text-[13px] whitespace-nowrap">{formatDatumIso(z.datum)}</td>
                  <td className="text-[13px]">{z.druh}</td>
                  <td className="text-[13px]">
                    {z.rozsah || "—"}
                    {z.vysledek ? <span className="mt-1 block text-[12px] text-ink-soft">{z.vysledek}</span> : null}
                  </td>
                  <td className="text-[13px]">
                    {z.zavada ? (
                      <>
                        <span className={z.odstraneno ? "" : "text-alert"}>{z.zavada}</span>
                        <span className="mt-1 block text-[12px] text-ink-soft">
                          {z.odstraneno ? `odstraněno: ${z.odstraneno}` : "neodstraněno"}
                        </span>
                      </>
                    ) : (
                      <span className="text-ink-soft">bez závad</span>
                    )}
                  </td>
                  <td className="text-[13px]">{z.provedl || "—"}</td>
                  <td>
                    <div className="flex justify-end gap-3 text-[12px]">
                      <button onClick={() => setF({ ...z })} className="text-brick hover:text-brick-deep">
                        upravit
                      </button>
                      <button onClick={() => smazat.mutate({ id: z.id })} className="text-ink-soft hover:text-alert">
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

      {f ? (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-charcoal/40 py-10">
          <div className="mx-auto max-w-[720px] border border-line bg-paper px-7 py-7">
            <header className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="section-label">{f.id ? "Úprava záznamu" : "Nový záznam"}</p>
                <h2 className="mt-2 text-[22px] text-brick-deep">Provozní deník</h2>
              </div>
              <button onClick={zavrit} className="text-[13px] text-ink-soft hover:text-brick-deep">
                zavřít
              </button>
            </header>
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <Field label="Datum">
                <TextInput type="date" value={f.datum ?? ""} onChange={(e) => zmen("datum", e.target.value)} />
              </Field>
              <Field label="Druh úkonu">
                <Select value={f.druh ?? "Prohlídka"} onChange={(e) => zmen("druh", e.target.value)}>
                  {(cis.data?.druhyProhlidky ?? ["Prohlídka"]).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Rozsah" hint="které zařízení nebo část — např. hlavní rozváděč RH" className="sm:col-span-2">
                <TextInput value={f.rozsah ?? ""} onChange={(e) => zmen("rozsah", e.target.value)} />
              </Field>
              <Field label="Výsledek" className="sm:col-span-2">
                <TextInput value={f.vysledek ?? ""} onChange={(e) => zmen("vysledek", e.target.value)} />
              </Field>
              <Field label="Zjištěná závada" hint="prázdné = bez závad">
                <TextInput value={f.zavada ?? ""} onChange={(e) => zmen("zavada", e.target.value)} />
              </Field>
              <Field label="Odstraněno" hint="kdy a jak">
                <TextInput value={f.odstraneno ?? ""} onChange={(e) => zmen("odstraneno", e.target.value)} />
              </Field>
              <Field label="Provedl" hint="jméno a odborná způsobilost" className="sm:col-span-2">
                <TextInput value={f.provedl ?? ""} onChange={(e) => zmen("provedl", e.target.value)} />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Poznámka">
                <TextArea value={f.poznamka ?? ""} onChange={(e) => zmen("poznamka", e.target.value)} rows={3} />
              </Field>
            </div>
            {chyba ? <p className="mt-5 text-[13px] text-alert">{chyba}</p> : null}
            <footer className="mt-8 flex items-center justify-between gap-4 border-t border-line pt-5">
              <div>
                {f.id ? (
                  <Tlacitko
                    varianta="text"
                    onClick={async () => {
                      await smazat.mutateAsync({ id: f.id as number });
                      zavrit();
                    }}
                  >
                    Smazat
                  </Tlacitko>
                ) : null}
              </div>
              <div className="flex gap-3">
                <Tlacitko varianta="obrys" onClick={zavrit}>
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
    </div>
  );
}
