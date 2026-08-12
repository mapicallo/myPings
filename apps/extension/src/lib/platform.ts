/** True when running as the Chrome/Edge extension (not the web PWA). */
export function isExtension(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage?.local;
}

export async function storageGet<T extends Record<string, unknown>>(
  keys: string | string[]
): Promise<T> {
  if (isExtension()) {
    return chrome.storage.local.get(keys) as Promise<T>;
  }
  const keyList = Array.isArray(keys) ? keys : [keys];
  const out: Record<string, unknown> = {};
  for (const key of keyList) {
    const raw = localStorage.getItem(key);
    if (raw != null) {
      try {
        out[key] = JSON.parse(raw);
      } catch {
        out[key] = raw;
      }
    }
  }
  return out as T;
}

export async function storageSet(data: Record<string, unknown>): Promise<void> {
  if (isExtension()) {
    await chrome.storage.local.set(data);
    return;
  }
  for (const [key, value] of Object.entries(data)) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

export function openUrl(url: string): void {
  if (isExtension() && chrome.tabs?.create) {
    void chrome.tabs.create({ url, active: true });
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export function extensionPrivacyUrl(): string {
  if (isExtension() && chrome.runtime?.getURL) {
    return chrome.runtime.getURL('privacy.html');
  }
  return 'https://www.ai4context.com/web-extensions/my-pings/privacy.html';
}
