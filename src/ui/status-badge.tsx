import type { ReactNode } from "react";

const tones = {
  error: "bg-[var(--aw-error-surface)] text-[var(--aw-error)]",
  info: "bg-[var(--aw-info-surface)] text-[var(--aw-info)]",
  success: "bg-[var(--aw-success-surface)] text-[var(--aw-success)]",
  warning: "bg-[var(--aw-warning-surface)] text-[var(--aw-warning)]",
} as const;

export function StatusBadge({ children, tone }: { children: ReactNode; tone: keyof typeof tones }) {
  return (
    <span className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
