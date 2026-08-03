"use client";

import { useEffect } from "react";

import { useCopy } from "@/lib/i18n";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useCopy();
  useEffect(() => {
    // Keep this boundary intentionally quiet: JaneQ has no analytics endpoint to notify.
  }, []);

  return (
    <main className="error-page">
      <p className="eyebrow">{t("errorBoundaryEyebrow")}</p>
      <h1>{t("errorBoundaryHeading")}</h1>
      <p>{t("errorBoundaryBody")}</p>
      <button className="button button-primary" onClick={() => reset()} type="button">{t("tryAgain")}</button>
    </main>
  );
}
