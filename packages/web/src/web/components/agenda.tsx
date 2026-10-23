import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Barevný štítek stavu — barvy odpovídají významu, ne dekoraci. */
export function Znak({
  children,
  ton = "neutralni",
  title,
}: {
  children: ReactNode;
  ton?: "neutralni" | "ok" | "blizi" | "pozor" | "info";
  title?: string;
}) {
  const tony: Record<string, string> = {
    neutralni: "border-line text-ink-soft",
    ok: "border-moss/40 text-moss",
    blizi: "border-amber/60 text-[#a9741f]",
    pozor: "border-alert/50 text-alert",
    info: "border-brick/40 text-brick",
  };
  return (
    <span
      title={title}
      className={cn(
        "inline-block shrink-0 border px-[7px] py-[2px] text-[10px] uppercase tracking-[0.12em] whitespace-nowrap",
        tony[ton],
      )}
    >
      {children}
    </span>
  );
}

/** Ton podle textu stavu, aby se barvy neopisovaly na každém místě. */
export function tonStavu(text: string): "neutralni" | "ok" | "blizi" | "pozor" | "info" {
  if (["PO TERMÍNU", "AKTUALIZOVAT", "ZMĚNA", "nahrazena", "zrušena", "Prošlé"].includes(text)) return "pozor";
  if (["Blíží se"].includes(text)) return "blizi";
  if (["OK", "V termínu", "Zaplaceno", "Ano", "platná", "Platné", "Bez omezení"].includes(text)) return "ok";
  if (["NEOVĚŘENO", "Poptávka", "Nabídka", "platná (přechod)"].includes(text)) return "info";
  return "neutralni";
}

/** Číselná metrika do souhrnného pruhu. */
export function Metrika({
  popisek,
  hodnota,
  doplneni,
  ton = "neutralni",
}: {
  popisek: string;
  hodnota: ReactNode;
  doplneni?: ReactNode;
  ton?: "neutralni" | "ok" | "blizi" | "pozor" | "info";
}) {
  const barvy: Record<string, string> = {
    neutralni: "text-ink",
    ok: "text-moss",
    blizi: "text-[#a9741f]",
    pozor: "text-alert",
    info: "text-brick",
  };
  return (
    <div className="border-t border-line pt-3">
      <p className="text-[11px] tracking-[0.1em] text-ink-soft uppercase">{popisek}</p>
      <p className={cn("mt-1 text-[24px] leading-none", barvy[ton])}>{hodnota}</p>
      {doplneni ? <p className="mt-1 text-[12px] text-ink-soft">{doplneni}</p> : null}
    </div>
  );
}

/** Pruh metrik nad tabulkou. */
export function Metriky({ children }: { children: ReactNode }) {
  return (
    <div className="mb-8 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
      {children}
    </div>
  );
}

/** Panel s tenkou linkou místo karty se stínem. */
export function Panel({
  nadpis,
  popis,
  children,
  pravo,
}: {
  nadpis?: string;
  popis?: ReactNode;
  children: ReactNode;
  pravo?: ReactNode;
}) {
  return (
    <section className="border-t-2 border-brick/30 pt-6">
      {nadpis ? (
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="section-label">{nadpis}</h2>
            {popis ? <p className="mt-2 max-w-[70ch] text-[13px] text-ink-soft">{popis}</p> : null}
          </div>
          {pravo}
        </header>
      ) : null}
      {children}
    </section>
  );
}

/** Odkaz na stažení exportu z API. */
export function Stahnout({
  href,
  children,
  varianta = "obrys",
}: {
  href: string;
  children: ReactNode;
  varianta?: "plne" | "obrys";
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-[2px] px-4 py-[7px] text-[13px] tracking-[0.04em] transition-colors",
        varianta === "plne"
          ? "bg-brick text-white hover:bg-brick-deep"
          : "border border-brick text-brick hover:bg-brick-wash",
      )}
    >
      {children}
    </a>
  );
}

export function PruhledneHledani({
  hodnota,
  onChange,
  placeholder,
  sirka = "w-[260px]",
}: {
  hodnota: string;
  onChange: (v: string) => void;
  placeholder: string;
  sirka?: string;
}) {
  return (
    <input
      value={hodnota}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn("field-input", sirka)}
    />
  );
}

/** Vysvětlující blok — co appka dělá a co ne. */
export function Poznamka({ children }: { children: ReactNode }) {
  return (
    <div className="border-t border-line bg-note-wash/60 px-5 py-4">
      <p className="max-w-[92ch] text-[12px] leading-relaxed text-ink-soft">{children}</p>
    </div>
  );
}