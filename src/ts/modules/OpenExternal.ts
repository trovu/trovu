/**
 * Open a URL externally (outside the PWA) when it points to a different
 * origin than the current app. Falls back to normal navigation for
 * same-origin URLs (which should stay inside the PWA).
 *
 * Background: when Trovu runs as an installed PWA (display: standalone),
 * `window.location.href` / `window.location.replace` keep external URLs
 * inside the PWA window. Android 14+ respects a programmatic click on an
 * anchor with `target="_blank"` as an external, user-initiated navigation
 * and hands it to the default browser / matching installed app via intent
 * dispatch. See https://github.com/trovu/trovu/issues/329.
 *
 * Same-origin URLs (including relative URLs like `../index.html#...`)
 * must stay inside the PWA / current browsing context.
 */

function isExternal(url: string): boolean {
  try {
    const absolute = new URL(url, window.location.href);
    return absolute.origin !== window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Navigate to `url`. For cross-origin URLs, clicks a hidden anchor with
 * `target="_blank"` so the browser leaves the PWA and opens the default
 * handler (browser or native app). For same-origin URLs, navigates normally
 * without opening a new tab, preserving PWA in-app flow.
 *
 * The anchor click works outside a user-gesture context (process page auto-
 * redirects on load) where `window.open` would be blocked, and unlike
 * `window.open(..., "_blank")` in Chrome it doesn't force a Custom Tab but
 * goes through Android's intent resolver so the user's actual default
 * browser is used.
 */
export function navigate(url: string): void {
  if (isExternal(url)) {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.style.display = "none";
    // `process.html` and `index.html` both always have a <body> at this
    // point; guard anyway so tests without DOM don't throw.
    const parent = document.body || document.documentElement;
    parent.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } else {
    window.location.href = url;
  }
}

/**
 * Variant used by CallHandler which historically used `location.replace`.
 * For external URLs we still must leave the PWA, so the anchor path is the
 * same; for internal URLs we use `replace` to avoid polluting history.
 */
export function navigateReplace(url: string): void {
  if (isExternal(url)) {
    navigate(url);
  } else {
    window.location.replace(url);
  }
}
