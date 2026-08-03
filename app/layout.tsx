import type { Metadata } from "next";

import { LanguageProvider } from "@/lib/i18n";

import "./globals.css";

const siteUrl = "https://janeq.theerapat.org";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "JaneQ — Free Direct QR Code Generator",
  description:
    "Create direct QR codes without ads, tracking redirects, accounts, expiration, or subscriptions. A free utility by theerapat.org.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "JaneQ — Free Direct QR Code Generator",
    description: "QR codes without the nonsense. Generate a direct, permanent code in your browser.",
    siteName: "JaneQ",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "JaneQ direct QR code generator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "JaneQ — Free Direct QR Code Generator",
    description: "Create a direct QR code in your browser. No ads, redirect links, or expiration.",
    images: ["/og-image.svg"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body><LanguageProvider>{children}</LanguageProvider></body>
    </html>
  );
}
