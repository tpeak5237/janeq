"use client";

import { setLocale, useCopy } from "@/lib/i18n";

export function LanguageToggle() {
  const { locale, t } = useCopy();
  const nextLocale = locale === "en" ? "th" : "en";
  return (
    <button
      aria-label={t(nextLocale === "th" ? "languageToThai" : "languageToEnglish")}
      className="language-button"
      onClick={() => setLocale(nextLocale)}
      type="button"
    >
      {locale === "en" ? t("languageThai") : t("languageEnglish")}
    </button>
  );
}
