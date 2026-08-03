"use client";

import Link from "next/link";

import { Icon } from "@/components/icons";
import { JaneQMark } from "@/components/janeq-mark";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { QrStudio } from "@/components/qr-studio";
import { useCopy } from "@/lib/i18n";

const siteUrl = "https://janeq.theerapat.org";

function HeroSignal({ bottomLabel, topLabel }: { bottomLabel: string; topLabel: string }) {
  const modules = [
    [1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 1, 1],
    [1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1],
    [1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1],
    [1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
    [1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 0],
    [0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1],
    [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 0],
    [1, 0, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1],
    [1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1],
    [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0],
  ];

  return (
    <div aria-hidden="true" className="hero-signal-art">
      <div className="signal-caption signal-caption-top">{topLabel}</div>
      <div className="signal-code-frame">
        <div className="signal-code-grid">
          {modules.flatMap((row, rowIndex) =>
            row.map((isDark, columnIndex) => (
              <span
                className={isDark ? "signal-module signal-module-dark" : "signal-module"}
                key={`${rowIndex}-${columnIndex}`}
              />
            )),
          )}
        </div>
        <div className="signal-cutout" />
        <div className="signal-arrow">
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="signal-caption signal-caption-bottom">
        <span>{bottomLabel}</span>
        <span>↗</span>
      </div>
    </div>
  );
}

function TrustItem({ label }: { label: string }) {
  return (
    <span className="trust-item">
      <span aria-hidden="true" className="trust-dot" />
      {label}
    </span>
  );
}

export default function HomePage() {
  const { t } = useCopy();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "JaneQ",
    url: siteUrl,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    isAccessibleForFree: true,
    description: t("heroLede"),
    creator: { "@type": "Organization", name: "theerapat.org", url: "https://theerapat.org" },
  };

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} type="application/ld+json" />
      <header className="site-header">
        <div className="site-header-inner page-width">
          <Link aria-label={t("ariaHome")} className="brand-lockup" href="/">
            <span className="brand-mark"><JaneQMark size={36} /></span>
            <span className="brand-copy">
              <span className="brand-name">JaneQ</span>
              <span className="brand-subtitle">{t("siteSubtitle")}</span>
            </span>
          </Link>
          <nav aria-label={t("ariaMainNav")} className="site-nav">
            <Link className="nav-link nav-link-muted" href="#why-janeq">{t("navWhy")}</Link>
            <a className="nav-link nav-link-muted" href="https://theerapat.org" rel="noreferrer" target="_blank">
              {t("navDomain")} <Icon name="arrow-up-right" size={14} />
            </a>
            <a className="nav-link nav-link-muted github-link" href="https://github.com/tpeak5237/janeq" rel="noreferrer" target="_blank">
              {t("navGithub")} <Icon name="arrow-up-right" size={14} />
            </a>
            <LanguageToggle />
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main>
        <section className="hero-section" id="top">
          <div className="hero-inner page-width">
            <div className="hero-copy">
              <p className="eyebrow eyebrow-coral"><span className="eyebrow-slash">{"//"}</span> {t("heroEyebrow")}</p>
              <h1>{t("heroH1A")} <span className="headline-accent">{t("heroH1Accent")}</span> {t("heroH1B")}</h1>
              <p className="hero-lede">{t("heroLede")}</p>
              <div className="hero-actions">
                <Link className="button button-primary" href="#generator">
                  {t("heroCta")} <Icon name="arrow-right" size={17} />
                </Link>
                <span className="hero-note"><Icon name="shield" size={16} /> {t("browserGenerated")}</span>
              </div>
              <div className="trust-row" aria-label={t("ariaPromises")}>
                <TrustItem label={t("trustNoRedirect")} />
                <TrustItem label={t("trustNoExpiry")} />
                <TrustItem label={t("trustFree")} />
              </div>
            </div>
            <HeroSignal bottomLabel={t("heroVisualBottom")} topLabel={t("heroVisualTop")} />
          </div>
          <div aria-hidden="true" className="hero-rule" />
        </section>

        <section className="generator-section page-width" id="generator">
          <div className="section-intro">
            <div>
              <p className="eyebrow"><span className="eyebrow-slash">{t("section01")}</span> {t("sectionMake")}</p>
              <h2>{t("sectionH2A")}<br /><span>{t("sectionH2B")}</span></h2>
            </div>
            <p className="section-lede">{t("sectionLede")}</p>
          </div>
          <QrStudio />
        </section>

        <section className="story-section page-width" id="why-janeq">
          <div className="story-lead">
            <p className="eyebrow"><span className="eyebrow-slash">02</span> {t("whyEyebrow")}</p>
            <h2>{t("whyHeading")}</h2>
          </div>
          <div className="story-body">
            <p className="story-emphasis">{t("whyEmphasis")}</p>
            <p>{t("whyBody")}</p>
            <div className="story-list" role="list">
              <div className="story-list-item" role="listitem"><span className="story-list-mark">01</span><span>{t("whyList1")}</span></div>
              <div className="story-list-item" role="listitem"><span className="story-list-mark">02</span><span>{t("whyList2")}</span></div>
              <div className="story-list-item" role="listitem"><span className="story-list-mark">03</span><span>{t("whyList3")}</span></div>
            </div>
          </div>
        </section>

        <section className="ownership-section page-width">
          <div className="ownership-mark"><JaneQMark size={70} /></div>
          <div>
            <p className="eyebrow eyebrow-coral"><span className="eyebrow-slash">03</span> {t("ownershipEyebrow")}</p>
            <h2>{t("ownershipHeading")}</h2>
            <p>{t("ownershipBody")}</p>
          </div>
          <div className="ownership-note">
            <span className="ownership-note-label">{t("ownershipNoteLabel")}</span>
            <strong>{t("ownershipNoteStrong")}</strong>
            <span>{t("ownershipNoteBody")}</span>
          </div>
        </section>

        <section className="privacy-section page-width" id="privacy">
          <div className="privacy-heading">
            <Icon name="shield" size={22} />
            <h2>{t("privacyHeading")}</h2>
          </div>
          <div className="privacy-grid">
            <p>{t("privacyP1")}</p>
            <p>{t("privacyP2")}</p>
            <p className="privacy-open-source">{t("privacyOpen")} <a href="https://github.com/tpeak5237/janeq" rel="noreferrer" target="_blank">{t("privacyRead")} <Icon name="arrow-up-right" size={14} /></a></p>
          </div>
        </section>

        <section className="acceptable-section page-width">
          <div>
            <p className="eyebrow"><span className="eyebrow-slash">04</span> {t("acceptableEyebrow")}</p>
            <h2>{t("acceptableHeading")}</h2>
          </div>
          <p>{t("acceptableBody")}</p>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner page-width">
          <div className="footer-brand">
            <JaneQMark size={28} />
            <span><strong>JaneQ</strong><span>{t("footerBy")}</span></span>
          </div>
          <p>{t("footerTagline")}</p>
          <div className="footer-links">
            <a href="https://github.com/tpeak5237/janeq" rel="noreferrer" target="_blank">{t("footerSource")} <Icon name="arrow-up-right" size={13} /></a>
            <a href="https://theerapat.org" rel="noreferrer" target="_blank">{t("footerDomain")} <Icon name="arrow-up-right" size={13} /></a>
          </div>
        </div>
      </footer>
    </>
  );
}
