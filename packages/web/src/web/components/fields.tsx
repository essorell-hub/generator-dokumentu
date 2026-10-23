import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="field-label">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-ink-soft">{hint}</span> : null}
    </label>
  );
}

type VstupProps = React.InputHTMLAttributes<HTMLInputElement>;

export function TextInput({ className, ...props }: VstupProps) {
  return <input {...props} className={cn("field-input", className)} />;
}

export function TextArea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("field-input", className)} rows={props.rows ?? 3} />;
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn("field-input", className)}>
      {children}
    </select>
  );
}

export function Check({
  label,
  hint,
  ...props
}: VstupProps & { label: ReactNode; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 py-2">
      <input
        type="checkbox"
        {...props}
        className="mt-[3px] size-4 shrink-0 accent-[#B04A2F]"
      />
      <span>
        <span className="block text-[14px] text-ink">{label}</span>
        {hint ? <span className="mt-[2px] block text-[12px] text-ink-soft">{hint}</span> : null}
      </span>
    </label>
  );
}

export function Tlacitko({
  varianta = "plne",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { varianta?: "plne" | "obrys" | "text" }) {
  const styly =
    varianta === "plne"
      ? "bg-brick text-white hover:bg-brick-deep"
      : varianta === "obrys"
        ? "border border-brick text-brick hover:bg-brick-wash"
        : "text-ink-soft hover:text-brick-deep";
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[2px] px-4 py-[7px] text-[13px] tracking-[0.04em] transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        styly,
        className,
      )}
    />
  );
}
