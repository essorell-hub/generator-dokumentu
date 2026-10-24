import { SectionTitle } from "./layout";
import { Tlacitko } from "./fields";
import { formatDatumCas } from "../lib/format";
import { useStavZalohy, useZalohovatNaDisk } from "../queries/zaloha";

/** Sekce Nastavení: zálohování databáze (ke stažení a na Google Disk). */
export function ZalohySekce() {
  const stav = useStavZalohy();
  const naDisk = useZalohovatNaDisk();
  const d = stav.data;

  return (
    <section>
      <SectionTitle hint="Záloha obsahuje všechny zakázky, rejstřík, revize, normy, osoby, měřidla a nastavení (bez přihlášení k Disku). Jednou týdně se vytvoří sama, když je program spuštěný a Disk připojený.">
        Zálohy
      </SectionTitle>
      <div className="border border-line px-5 py-5">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <div>
            <span className="field-label">Poslední záloha na Disk</span>
            <span className="text-[15px] text-ink">
              {stav.isLoading ? "Načítám…" : d?.posledni ? formatDatumCas(d.posledni) : "Zatím žádná"}
            </span>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            <a href="/api/soubory/zaloha.json" download>
              <Tlacitko varianta="obrys" type="button">
                Stáhnout zálohu
              </Tlacitko>
            </a>
            <Tlacitko type="button" onClick={() => naDisk.mutate(undefined)} disabled={naDisk.isPending || !d?.driveOk}>
              {naDisk.isPending ? "Zálohuji…" : "Zálohovat na Disk"}
            </Tlacitko>
          </div>
        </div>

        {d && !d.driveOk ? (
          <p className="mt-4 text-[13px] text-ink-soft">
            Zálohování na Disk zatím nejde:{" "}
            {d.driveChybi === "pripojeni" ? "Google Disk není připojený." : "není vybraná cílová složka na Disku."} Ruční
            stažení zálohy funguje vždy.
          </p>
        ) : null}
        {naDisk.isError ? <p className="mt-4 text-[13px] text-alert">{naDisk.error.message}</p> : null}
        {naDisk.data ? (
          <p className="mt-4 text-[13px] text-moss">
            Záloha {naDisk.data.nazev} ({naDisk.data.pocetRadku} záznamů) je uložená ve složce{" "}
            <a className="underline" href={naDisk.data.slozkaUrl} target="_blank" rel="noreferrer">
              Zálohy databáze
            </a>
            .
          </p>
        ) : null}
      </div>
    </section>
  );
}
