export type BrowserStorageRead =
  | { available: true; value: string | null }
  | { available: false; value: null };

export function readBrowserStorage(key: string): BrowserStorageRead {
  if (typeof window === "undefined") return { available: false, value: null };

  try {
    return { available: true, value: window.localStorage.getItem(key) };
  } catch {
    return { available: false, value: null };
  }
}

export function writeBrowserStorage(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
