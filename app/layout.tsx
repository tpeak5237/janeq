import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";

import { LanguageProvider } from "@/lib/i18n";

import "./globals.css";

const siteUrl = "https://janeq.theerapat.org";

const notoSansThai = Noto_Sans_Thai({
  display: "swap",
  subsets: ["thai", "latin"],
  variable: "--font-noto-sans-thai",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "JaneQ — Local QR Generator and Scanner",
  description:
    "Create and scan QR codes locally in your browser with camera or image input. No account, tracking redirect, or QR content upload.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "JaneQ — Local QR Generator and Scanner",
    description:
      "Generate direct QR codes or scan them locally with your camera or an image.",
    siteName: "JaneQ",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "JaneQ local QR generator and scanner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JaneQ — Local QR Generator and Scanner",
    description:
      "Create or scan a QR code in your browser. No account or QR content upload.",
    images: ["/og-image.svg"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className={notoSansThai.variable} lang="en" suppressHydrationWarning>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
