/** @module UrlOpener */

/**
 * Open an external URL, escaping the PWA shell on Android Chrome.
 *
 * Background: when Trovu is installed as a PWA on Android (manifest
 * `"display": "standalone"`, `"scope": "/"`), a plain
 * `window.location.href = "https://example.com"` keeps the navigation inside
 * the PWA's in-app browser context. That is the long-standing bug reported in
 * https://github.com/trovu/trovu/issues/329 — target URLs do not open in the
 * user's default browser.
 *
 * Naive escapes that do *not* work in Chrome PWA on Android, and which have
 * been tried unsuccessfully in many prior PRs on #329:
 *   - `window.open(url, "_blank")`
 *   - `window.open(url, "_blank", "noopener,noreferrer")`
 *   - Programmatic click on `<a target="_blank" rel="noopener">`
 *   - Modifying the manifest `scope` (would break in-app navigation everywhere
 *     else and is not actually how Chrome decides whether to leave the PWA).
 *
 * The fix that actually works on Android is the `intent://` URL scheme. It is
 * Android's documented hand-off mechanism: the OS receives the intent, looks
 * up the user's default browser, and opens the URL there. Chrome the PWA host
 * does not get a say.
 *
 * On every other platform — desktop browsers, Android Chrome tab (not PWA),
 * iOS Safari PWA, server-side rendering — a normal same-tab navigation is the
 * correct behavior and is preserved as the fallback.
 *
 * The optional `navigate` parameter is for unit testing only — production code
 * should always call openExternal(url) with one argument. jsdom does not allow
 * intercepting `window.location.href = X` directly, so we inject the side
 * effect instead of mocking it.
 */
export type NavigateFn = (url: string) => void;

export function openExternal(url: string, navigate?: NavigateFn): void {
  const go: NavigateFn =
    navigate ??
    ((u: string) => {
      if (typeof window !== "undefined") {
        window.location.href = u;
      }
    });

  const isPwa =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  const isAndroid =
    typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

  if (isPwa && isAndroid) {
    const intentUrl = toAndroidIntentUrl(url);
    if (intentUrl) {
      go(intentUrl);
      return;
    }
    // Bad URL or unsupported scheme — fall through to normal nav rather than
    // breaking the user's query.
  }

  go(url);
}

/**
 * Convert an http(s) URL to an Android intent URL that forces the OS default
 * browser. Returns null when the URL can't be parsed or the scheme is not
 * http(s) (intent: only makes sense for those).
 *
 * Format reference:
 *   https://developer.chrome.com/docs/android/intents
 *
 * Exported for unit testing.
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
  // Everything after "scheme://"
  const rest = url.substring(parsed.protocol.length + 2);
  return (
    `intent://${rest}` +
    `#Intent;scheme=${scheme};` +
    `action=android.intent.action.VIEW;` +
    `category=android.intent.category.BROWSABLE;` +
    `end`
  );
}
