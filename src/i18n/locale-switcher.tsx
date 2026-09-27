"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useActionState, useSyncExternalStore } from "react";

import { changeLocaleAction, type LocaleActionState } from "./actions";
import { useI18n } from "./context";

const initialState: LocaleActionState = { status: "idle" };
const subscribeToHydration = () => () => {};

export function LocaleSwitcher() {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const [state, action, pending] = useActionState(changeLocaleAction, initialState);
  const query = searchParams.toString();
  const returnTo = `${pathname}${query ? `?${query}` : ""}`;

  return (
    <form action={action} className="flex flex-wrap items-center gap-2 text-sm">
      <input type="hidden" name="currentLocale" value={locale} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <label className="flex items-center gap-2">
        <span className="font-medium">{t("Язык интерфейса")}</span>
        <select
          className="min-h-10 rounded-lg border border-border-strong bg-surface px-3"
          name="locale"
          key={locale}
          defaultValue={locale}
          disabled={pending || !hydrated}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        >
          <option value="ru">{t("Русский")}</option>
          <option value="en">{t("Английский")}</option>
        </select>
      </label>
      {pending ? <span role="status">{t("Переключаем язык…")}</span> : null}
      {state.status === "error" ? (
        <span role="alert" className="text-[var(--aw-error)]">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
