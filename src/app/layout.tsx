import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const manrope = Manrope({
  subsets: ["cyrillic", "latin"],
  display: "swap",
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "AI Wardrobe",
  description: "Приватный цифровой гардероб — foundation environment.",
  applicationName: "AI Wardrobe",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#F8F7F3",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ru" className={manrope.variable}>
      <body>
        <a className="skip-link" href="#main-content">
          Перейти к содержимому
        </a>
        {children}
      </body>
    </html>
  );
}
