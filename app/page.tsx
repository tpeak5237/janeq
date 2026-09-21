"use client";

import { useState } from "react";
import Link from "next/link";

import { Icon } from "@/components/icons";
import { JaneQMark } from "@/components/janeq-mark";
import { LanguageToggle } from "@/components/language-toggle";
import { QrScanner } from "@/components/qr-scanner";
import { QrStudio } from "@/components/qr-studio";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCopy } from "@/lib/i18n";

const siteUrl = "https://janeq.theerapat.org";
type ToolMode = "create" | "scan";

export default function HomePage() {
  const { t } = useCopy();
  const [mode, setMode] = useState<ToolMode>("create");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "JaneQ",
    url: siteUrl,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    isAccessibleForFree: true,
    description: t("siteDescription"),
    creator: {
      "@type": "Organization",
      name: "theerapat.org",
      url: "https://theerapat.org",
    },
  };

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        type="application/ld+json"
      />
      <header className="site-header">
        <div className="site-header-inner page-width">
          <Link aria-label={t("ariaHome")} className="brand-lockup" href="/">
            <span className="brand-mark">
              <JaneQMark size={28} />
            </span>
            <span className="brand-copy">
              <span className="brand-name">JaneQ</span>
              <span className="brand-subtitle">{t("siteSubtitle")}</span>
            </span>
          </Link>
          <nav aria-label={t("ariaMainNav")} className="site-nav">
            <a
              aria-label={t("navGithub")}
              className="nav-link nav-link-muted github-link"
              href="https://github.com/tpeak5237/janeq"
              rel="noreferrer"
              target="_blank"
            >
              <span className="github-wordmark">{t("navGithub")}</span>
              <Icon name="arrow-up-right" size={14} />
            </a>
            <LanguageToggle />
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="utility-main">
        <section aria-labelledby="utility-heading" className="utility-shell page-width">
          <div className="utility-toolbar">
            <div>
              <span className="workspace-kicker">{t("siteSubtitle")}</span>
              <h1 id="utility-heading">
                {mode === "create" ? t("createQr") : t("scanQr")}
              </h1>
            </div>
            <div aria-label={t("ariaToolModes")} className="tool-mode-switcher" role="tablist">
              <button
                aria-selected={mode === "create"}
                className="tool-mode-button"
                onClick={() => setMode("create")}
                role="tab"
                type="button"
              >
                {t("createQr")}
              </button>
              <button
                aria-selected={mode === "scan"}
                className="tool-mode-button"
                onClick={() => setMode("scan")}
                role="tab"
                type="button"
              >
                {t("scanQr")}
              </button>
            </div>
          </div>

          {mode === "create" ? <QrStudio /> : <QrScanner />}
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner page-width">
          <div className="footer-brand">
            <JaneQMark size={24} />
            <span>
              <strong>JaneQ</strong>
              <span>{t("footerBy")}</span>
            </span>
          </div>
          <p>{t("footerUtility")}</p>
          <div className="footer-links">
            <a href="https://github.com/tpeak5237/janeq" rel="noreferrer" target="_blank">
              {t("footerSource")} <Icon name="arrow-up-right" size={13} />
            </a>
            <a href="https://theerapat.org" rel="noreferrer" target="_blank">
              {t("footerDomain")} <Icon name="arrow-up-right" size={13} />
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
