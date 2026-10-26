import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Mosaic({ className }: { className?: string }) {
  return <div className={cn("mosaic", className)} aria-hidden />;
}

function NavItem({ href, children }: { href: string; children: ReactNode }) {
  const location = useLocation();
  const path = location.pathname;
  const aktivni =
    href === "/"
      ? path === "/" || path.startsWith("/zakazka/")
      : path.startsWith(href);
  return (
    <Link
      to={href}
      className={cn(
        "text-[12px] uppercase tracking-[0.12em] whitespace-nowrap transition-colors",
        aktivni ? "text-brick" : "text-ink-soft hover:text-brick-deep",
      )}
    >
      {children}
    </Link>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <Mosaic />
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-[1080px] items-center justify-between gap-6 px-6 py-5">
          <Link to="/" className="flex items-baseline gap-3">
            <span className="font-mono text-[11px] tracking-[0.28em] text-ink-soft uppercase">
              Loskot Hozáková
            </span>
            <span className="hidden text-[13px] whitespace-nowrap text-ink-soft xl:inline">Generátor dokumentů</span>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2">
            <NavItem href="/">Dokumenty</NavItem>
            <NavItem href="/rejstrik">Rejstřík zakázek</NavItem>
            <NavItem href="/revize">Hlídání revizí</NavItem>
            <NavItem href="/normy">Rejstřík norem</NavItem>
            <NavItem href="/maily">E-maily</NavItem>
            <NavItem href="/provoz">Provoz</NavItem>
            <NavItem href="/nastaveni">Nastavení</NavItem>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1080px] px-6 py-12">{children}</main>

      <Mosaic className="mt-16" />
      <footer className="bg-charcoal">
        <div className="mx-auto max-w-[1080px] px-6 py-7">
          <p className="text-[12px] tracking-[0.06em] text-[#c9c3bd]">
            Interní nástroj kanceláře. Šablony rev-01 až rev-03-2026 (revize je v názvu souboru), dokumenty se ukládají do
            složky zakázky na Google Drive.
          </p>
        </div>
      </footer>
    </div>
  );
}

export function SectionTitle({
  children,
  align = "left",
  hint,
}: {
  children: ReactNode;
  align?: "left" | "center";
  hint?: ReactNode;
}) {
  return (
    <div className={cn("mb-6", align === "center" && "text-center")}>
      <h2 className="section-label">{children}</h2>
      {hint ? <p className="mt-2 text-[13px] text-ink-soft">{hint}</p> : null}
    </div>
  );
}

export function PageTitle({ children, podtitul }: { children: ReactNode; podtitul?: ReactNode }) {
  return (
    <div className="mb-10">
      <h1 className="text-[32px] leading-tight font-normal text-brick-deep">{children}</h1>
      {podtitul ? <p className="mt-3 max-w-[70ch] text-ink-soft">{podtitul}</p> : null}
    </div>
  );
}

const STAVY: Record<string, { text: string; className: string }> = {
  rozpracovana: { text: "Rozpracovaná", className: "text-amber border-amber/40" },
  vygenerovano: { text: "Vygenerováno", className: "text-moss border-moss/40" },
};

export function StavBadge({ stav }: { stav: string }) {
  const info = STAVY[stav] ?? { text: stav, className: "text-ink-soft border-line" };
  return (
    <span
      className={cn(
        "inline-block border px-2 py-[2px] text-[10px] uppercase tracking-[0.14em]",
        info.className,
      )}
    >
      {info.text}
    </span>
  );
}

export function Hr() {
  return <hr className="my-10 border-line" />;
}

export function PrazdnyStav({
  nadpis,
  text,
  akce,
}: {
  nadpis: string;
  text: string;
  akce?: ReactNode;
}) {
  return (
    <div className="border-y border-line py-20 text-center">
      <p className="section-label">{nadpis}</p>
      <p className="mx-auto mt-4 max-w-[52ch] text-ink-soft">{text}</p>
      {akce ? <div className="mt-7 flex justify-center">{akce}</div> : null}
    </div>
  );
}
