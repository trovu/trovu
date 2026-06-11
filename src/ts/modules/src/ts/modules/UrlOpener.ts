/** @module UrlOpener */

/**
 * Opens external URLs safely, escaping Android PWA (WebAPK) when needed.
 */
export function openExternal(url: string): void {
  const isPwa =
    typeof window !== "undefined" &&
    window.matchMedia?.("(display-mode: standalone)")?.matches;

  const isAndroid =
    typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

  if (isPwa && isAndroid) {
    const intentUrl = toAndroidIntentUrl(url);
    if (intentUrl) {
      window.location.href = intentUrl;
      return;
    }
  }

  window.location.href = url;
}

/**
 * Converts http/https URL to Android intent URL.
 */
function toAndroidIntentUrl(url: string): string | null {
  try {
    const parsed = new URL(url);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    const scheme = parsed.protocol.replace(":", "");
    const rest = url.substring(parsed.protocol.length + 2);

    const fallback = encodeURIComponent(url);

    return (
      `intent://${rest}` +
      `#Intent;scheme=${scheme};` +
      `action=android.intent.action.VIEW;` +
      `category=android.intent.category.BROWSABLE;` +
      `S.browser_fallback_url=${fallback};` +
      `end`
    );
  } catch {
    return null;
  }
}