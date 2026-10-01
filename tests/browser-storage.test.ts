import { afterEach, describe, expect, it, vi } from "vitest";

import { getThemeSnapshot, setThemePreference } from "@/components/theme-toggle";
import { readBrowserStorage, writeBrowserStorage } from "@/lib/browser-storage";
import { getLocaleSnapshot, setLocale } from "@/lib/i18n";

function stubBlockedStorage() {
  const browserWindow = {
    dispatchEvent: vi.fn(),
    matchMedia: vi.fn(() => ({ matches: false })),
  };
  Object.defineProperty(browserWindow, "localStorage", {
    configurable: true,
    get() {
      throw new DOMException("Storage access is denied", "SecurityError");
    },
  });
  vi.stubGlobal("window", browserWindow);
  vi.stubGlobal("document", { documentElement: { dataset: {}, lang: "en" } });
  return { browserWindow, documentElement: (document as Document).documentElement };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("browser preference storage", () => {
  it("reports storage access failures instead of throwing", () => {
    stubBlockedStorage();

    expect(readBrowserStorage("janeq-locale")).toEqual({
      available: false,
      value: null,
    });
    expect(writeBrowserStorage("janeq-locale", "th")).toBe(false);
  });

  it("handles storage methods that throw on read or write", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem() {
          throw new DOMException("Storage is unavailable", "SecurityError");
        },
        setItem() {
          throw new DOMException("Storage quota is exhausted", "QuotaExceededError");
        },
      },
    });

    expect(readBrowserStorage("janeq-theme")).toEqual({
      available: false,
      value: null,
    });
    expect(writeBrowserStorage("janeq-theme", "dark")).toBe(false);
  });

  it("keeps locale and theme changes available for the current tab", () => {
    const { documentElement } = stubBlockedStorage();

    setLocale("th");
    setThemePreference("dark");

    expect(getLocaleSnapshot()).toBe("th");
    expect(documentElement.lang).toBe("th");
    expect(getThemeSnapshot()).toBe("dark");
    expect(documentElement.dataset.theme).toBe("dark");
  });
});
