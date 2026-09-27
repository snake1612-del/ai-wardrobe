"use client";

import { useActionState } from "react";

import { useI18n } from "@/i18n/context";
import type { AccountSettings, SettingsActionState } from "@/modules/account/settings-model";
import { saveRegionalSettingsAction } from "@/modules/account/server/settings-actions";
import { Button } from "@/ui/button";

const idle: SettingsActionState = { status: "idle" };

export function RegionalSettingsForm({ settings }: { settings: AccountSettings }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(saveRegionalSettingsAction, {
    ...idle,
    version: settings.version,
  });

  return (
    <form action={action} className="space-y-5" aria-describedby="regional-settings-help">
      <input type="hidden" name="expectedVersion" value={state.version ?? settings.version} />
      <p id="regional-settings-help" className="text-sm text-text-secondary">
        {t("Эти параметры сохраняются только для текущего аккаунта.")}
      </p>
      <label className="block space-y-2">
        <span className="font-medium">{t("Часовой пояс")}</span>
        <input
          className="field"
          name="timezoneName"
          defaultValue={settings.timezoneName}
          placeholder="Europe/Moscow"
          autoComplete="off"
          maxLength={100}
          required
          disabled={pending}
          aria-describedby="timezone-help"
        />
      </label>
      <p id="timezone-help" className="text-sm text-text-tertiary">
        {t("Используйте название IANA, например Europe/Moscow.")}
      </p>
      <label className="block space-y-2">
        <span className="font-medium">{t("Система единиц")}</span>
        <select
          className="field"
          name="unitsCode"
          defaultValue={settings.unitsCode}
          disabled={pending}
        >
          <option value="metric">{t("Метрическая")}</option>
          <option value="imperial">{t("Имперская")}</option>
        </select>
      </label>
      <label className="block space-y-2">
        <span className="font-medium">{t("Начало недели")}</span>
        <select
          className="field"
          name="weekStartsOn"
          defaultValue={String(settings.weekStartsOn)}
          disabled={pending}
        >
          <option value="1">{t("Понедельник")}</option>
          <option value="7">{t("Воскресенье")}</option>
        </select>
      </label>
      {state.message ? (
        <p
          className={
            state.status === "error" ? "text-[var(--aw-error)]" : "text-[var(--aw-success)]"
          }
          role={state.status === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {t(state.message)}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? t("Сохраняем…") : t("Сохранить региональные настройки")}
      </Button>
    </form>
  );
}
