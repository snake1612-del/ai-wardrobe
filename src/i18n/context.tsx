"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { translate, type Locale } from "./dictionary";

type I18nValue = Readonly<{
  locale: Locale;
  t: (key: string, values?: Record<string, string | number>) => string;
}>;

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo<I18nValue>(
    () => ({ locale, t: (key, values) => translate(locale, key, values) }),
    [locale],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("I18nProvider is missing");
  return value;
}
