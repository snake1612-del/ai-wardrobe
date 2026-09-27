import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { Suspense, type ReactNode } from "react";

import { I18nProvider } from "@/i18n/context";
import { LocaleSwitcher } from "@/i18n/locale-switcher";
import { getServerI18n } from "@/i18n/server";

import "./globals.css";

const manrope = Manrope({
  subsets: ["cyrillic", "latin"],
  display: "swap",
  variable: "--font-manrope",
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return {
    title: "AI Wardrobe",
    description: t("Приватный цифровой гардероб."),
    applicationName: "AI Wardrobe",
    icons: { icon: "/icon.svg" },
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = { themeColor: "#F8F7F3", colorScheme: "light" };

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { locale, t } = await getServerI18n();
  return (
    <html lang={locale} className={manrope.variable}>
      <body>
        <I18nProvider locale={locale}>
          <a className="skip-link" href="#main-content">
            {t("Перейти к содержимому")}
          </a>
          <nav
            aria-label={t("Выбор языка")}
            className="mx-auto flex max-w-7xl justify-end px-4 pt-3 sm:px-6"
          >
            <Suspense fallback={null}>
              <LocaleSwitcher />
            </Suspense>
          </nav>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
