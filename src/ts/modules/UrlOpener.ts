/** @module UrlOpener */

/**
 * A wrapper around window.location to make navigation testable in Node/Jest environments.
 */
export const _location = {
  get href(): string {
    return typeof window !== "undefined" ? window.location.href : "";
  },
  set href(val: string) {
    if (typeof window !== "undefined") {
      window.location.href = val;
    }
  },
  replace(val: string) {
    if (typeof window !== "undefined") {
      window.location.replace(val);
    }
  }
};

/**
 * Open a URL, escaping the PWA shell on Android Chrome when it is an external URL.
 *
 * @param {string} url - The URL to open.
 * @param {boolean} replace - Whether to use location.replace (true) or location.href (false) for standard navigation.
 */
export function openExternal(url: string, replace = false): void {
  if (typeof window === "undefined") {
    return;
  }

  const isPwa =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  const isAndroid =
    typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

  if (isPwa && isAndroid) {
    const intentUrl = toAndroidIntentUrl(url);
    if (intentUrl) {
      _location.href = intentUrl;
      // If we are on the /process/ redirect page, redirect the PWA shell back to the home page after triggering the intent
      if (replace) {
        setTimeout(() => {
          _location.replace("../index.html");
        }, 150);
      }
      return;
    }
  }

  if (replace) {
    _location.replace(url);
  } else {
    _location.href = url;
  }
}

/**
 * Convert an http(s) URL to an Android intent URL that forces the OS default browser.
 * Returns null if the URL cannot be parsed or does not use http/https.
 */
export function toAndroidIntentUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const scheme = parsed.protocol.slice(0, -1); // strip trailing ":"
  if (scheme !== "https" && scheme !== "http") {
    return null;
  }
  const rest = url.substring(parsed.protocol.length + 2);
  const fallbackUrl = encodeURIComponent(url);
  return (
    `intent://${rest}` +
    `#Intent;scheme=${scheme};` +
    `package=com.android.chrome;` +
    `action=android.intent.action.VIEW;` +
    `category=android.intent.category.BROWSABLE;` +
    `launchFlags=0x10000000;` +
    `S.browser_fallback_url=${fallbackUrl};` +
    `end`
  );
}
