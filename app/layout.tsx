import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";

import { LanguageProvider } from "@/lib/i18n";

import "./globals.css";

const siteUrl = "https://janeq.theerapat.org";

const notoSansThai = Noto_Sans_Thai({
  display: "swap",
  subsets: ["thai", "latin"],
  variable: "--font-noto-sans-thai",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "JaneQ — Local QR Generator and Scanner",
  description:
    "Create and scan QR codes on this device. No account, no tracking redirect.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "JaneQ — Local QR Generator and Scanner",
    description: "Create or scan a QR code on this device. No account or tracking redirect.",
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
    description: "Create or scan a QR code on this device. No account or tracking redirect.",
    images: ["/og-image.svg"],
  },
  robots: { index: true, follow: true },
};

const bootScript = `try{var t=localStorage.getItem("janeq-theme");var l=localStorage.getItem("janeq-locale");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t;if(l==="th")document.documentElement.lang="th";}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className={notoSansThai.variable} lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
