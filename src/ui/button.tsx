import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentPropsWithoutRef } from "react";

const base =
  "inline-flex min-h-12 items-center justify-center rounded-[var(--aw-radius-md)] bg-accent px-5 py-3 text-[15px] leading-5 font-semibold text-white transition-colors hover:bg-accent-hover active:bg-accent-pressed disabled:cursor-not-allowed disabled:opacity-60";

export function Button({
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`${base} ${className}`} type={type} {...props} />;
}

export function ButtonLink({ className = "", ...props }: ComponentPropsWithoutRef<typeof Link>) {
  return <Link className={`${base} ${className}`} {...props} />;
}
