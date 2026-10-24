import { Link } from "wouter";
import { formatDatumIso } from "../lib/format";
import { usePrehledTerminu } from "../queries/prehled";

function Dni({ dni }: { dni: number | null }) {
  if (dni === null) return null;
  if (dni < 0) return <span className="text-alert">před {-dni} dny</span>;
  if (dni === 0) return <span className="text-alert">dnes</span>;
  return <span>za {dni} dní</span>;
}

/** Úvodní přehled: co je po termínu a co se blíží. Když je vše v pořádku, nezobrazí se. */
export function PrehledTerminu() {
  const p = usePrehledTerminu();
  const d = p.data;
  if (!d) return null;

  const revize = d.revize.poTerminu + d.revize.bliziSe;
  const provoz = d.provoz.prosle + d.provoz.bliziSe;
  const normy = d.normy.poTerminu;
  if (revize + provoz + normy === 0) return null;

  return (
    <section className="mb-10 border border-line bg-brick-wash/40 p-6">
      <p className="section-label">Pozor na termíny</p>
      <div className="mt-4 grid gap-6 sm:grid-cols-3">
        {revize > 0 ? (
          <div>
            <Link href="/revize" className="text-[15px] text-brick-deep underline">
              Pravidelné revize
            </Link>
            <p className="mt-1 text-[13px] text-ink-soft">
              {d.revize.poTerminu > 0 ? <span className="text-alert">po termínu: {d.revize.poTerminu}</span> : null}
              {d.revize.poTerminu > 0 && d.revize.bliziSe > 0 ? " · " : null}
              {d.revize.bliziSe > 0 ? <>blíží se: {d.revize.bliziSe}</> : null}
            </p>
            <ul className="mt-2 space-y-1 text-[13px]">
              {d.revize.polozky.map((r, i) => (
                <li key={i}>
                  <span className="text-ink">{r.kdo}</span>{" "}
                  <span className="text-ink-soft">
                    ({r.datum ? formatDatumIso(r.datum) : "—"}, <Dni dni={r.dni} />)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {provoz > 0 ? (
          <div>
            <Link href="/provoz" className="text-[15px] text-brick-deep underline">
              Osoby, měřidla, oprávnění
            </Link>
            <p className="mt-1 text-[13px] text-ink-soft">
              {d.provoz.prosle > 0 ? <span className="text-alert">prošlé: {d.provoz.prosle}</span> : null}
              {d.provoz.prosle > 0 && d.provoz.bliziSe > 0 ? " · " : null}
              {d.provoz.bliziSe > 0 ? <>blíží se: {d.provoz.bliziSe}</> : null}
            </p>
            <ul className="mt-2 space-y-1 text-[13px]">
              {d.provoz.polozky.map((r, i) => (
                <li key={i}>
                  <span className="text-ink">{r.kdo}</span>{" "}
                  <span className="text-ink-soft">
                    — {r.co} ({r.datum ? formatDatumIso(r.datum) : "—"}, <Dni dni={r.dni} />)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {normy > 0 ? (
          <div>
            <Link href="/normy" className="text-[15px] text-brick-deep underline">
              Rejstřík norem
            </Link>
            <p className="mt-1 text-[13px] text-alert">kontrola po termínu: {normy}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
