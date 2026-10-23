/** Formátování pro UI — jednotně česky. */

export function formatDatumCas(hodnota: string | Date | null | undefined): string {
  if (!hodnota) return "—";
  const d = hodnota instanceof Date ? hodnota : new Date(hodnota);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** `2026-10-07` → `07. 10. 2026`; jiné tvary vrací beze změny. */
export function formatDatumIso(hodnota: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((hodnota ?? "").trim());
  if (!m) return hodnota ?? "";
  return `${m[3]}. ${m[2]}. ${m[1]}`;
}

export function formatVelikost(bajtu: number): string {
  if (!bajtu) return "—";
  if (bajtu < 1024) return `${bajtu} B`;
  return `${Math.round(bajtu / 1024)} kB`;
}
