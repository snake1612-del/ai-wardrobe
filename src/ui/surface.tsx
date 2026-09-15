import type { ComponentPropsWithoutRef } from "react";

type SurfaceProps = ComponentPropsWithoutRef<"section"> & { tone?: "default" | "error" };

export function Surface({ className = "", tone = "default", ...props }: SurfaceProps) {
  const toneClass =
    tone === "error"
      ? "border-[var(--aw-error)] bg-[var(--aw-error-surface)]"
      : "border-border-subtle bg-surface";
  return (
    <section
      className={`rounded-[var(--aw-radius-lg)] border p-6 shadow-[var(--aw-shadow-raised)] sm:p-8 ${toneClass} ${className}`}
      {...props}
    />
  );
}
