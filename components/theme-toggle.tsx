"use client";

import { useEffect, useSyncExternalStore } from "react";

import { Icon } from "@/components/icons";
import { readBrowserStorage, writeBrowserStorage } from "@/lib/browser-storage";
import { useCopy } from "@/lib/i18n";

type Theme = "light" | "dark";

const THEME_EVENT = "janeq-theme-change";
let themeFallback: Theme | null = null;

export function getThemeSnapshot(): Theme {
  if (typeof window === "undefined") return "light";
  if (themeFallback !== null) return themeFallback;

  const preference = readBrowserStorage("janeq-theme");
  if (preference.value === "light" || preference.value === "dark") return preference.value;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribe(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== "janeq-theme" && event.key !== null) return;
    themeFallback = null;
    callback();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(THEME_EVENT, callback);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(THEME_EVENT, callback);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, () => "light");
  const { t } = useCopy();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setThemePreference(nextTheme);
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

export function setThemePreference(theme: Theme): void {
  const persisted = writeBrowserStorage("janeq-theme", theme);
  themeFallback = persisted ? null : theme;
  document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new Event(THEME_EVENT));
}
