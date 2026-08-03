"use client";

import { useEffect, useSyncExternalStore } from "react";

import { Icon } from "@/components/icons";
import { useCopy } from "@/lib/i18n";

type Theme = "light" | "dark";

const THEME_EVENT = "janeq-theme-change";

function getTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const storedTheme = window.localStorage.getItem("janeq-theme") as Theme | null;
  return storedTheme ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_EVENT, callback);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light");
  const { t } = useCopy();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    window.localStorage.setItem("janeq-theme", nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  return (
    <button
      aria-label={t(theme === "light" ? "themeToDark" : "themeToLight")}
      className="icon-button"
      onClick={toggleTheme}
      type="button"
    >
      <Icon name={theme === "light" ? "moon" : "sun"} />
    </button>
  );
}
