"use client";

import Link from "next/link";

import { useCopy } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useCopy();
  return (
    <main className="error-page">
      <p className="eyebrow">{t("notFoundEyebrow")}</p>
      <h1>{t("notFoundHeading")}</h1>
      <p>{t("notFoundBody")}</p>
      <Link className="button button-primary" href="/">{t("backToJaneq")}</Link>
    </main>
  );
}
