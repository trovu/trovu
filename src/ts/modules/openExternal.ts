/** Open a shortcut target outside a standalone PWA when possible. */

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  if (window.matchMedia("(display-mode: standalone)").matches) {
    return true;
  }
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

export function isAndroidUserAgent(
  userAgent: string = typeof navigator === "undefined" ? "" : navigator.userAgent,
): boolean {
  return /Android/i.test(userAgent);
}

export function isIOSUserAgent(
  userAgent: string = typeof navigator === "undefined" ? "" : navigator.userAgent,
): boolean {
  return /iPad|iPhone|iPod/i.test(userAgent);
}

export function isInAppRedirect(url: string): boolean {
  return url.startsWith("../") || url.startsWith("./") || url.startsWith("index.html") || url.startsWith("#");
}

/**
 * Chrome's PWA task swallows https navigations and Custom Tabs.
 * FLAG_ACTIVITY_NEW_TASK | FLAG_ACTIVITY_MULTIPLE_TASK | FLAG_ACTIVITY_NEW_DOCUMENT
 * asks the OS for a separate browser document (address bar + tab switcher).
 */
export function toAndroidIntentUrl(url: string): string {
  const parsed = new URL(url);
  const scheme = parsed.protocol.replace(":", "");
  if (scheme !== "http" && scheme !== "https") {
    return url;
  }
  const path = `${parsed.host}${parsed.pathname}${parsed.search}${parsed.hash}`;
  return (
    `intent://${path}#Intent;scheme=${scheme};action=android.intent.action.VIEW;` +
    `category=android.intent.category.BROWSABLE;launchFlags=0x18080000;end`
  );
}

export function toIOSSafariUrl(url: string): string {
  if (url.startsWith("https://")) {
    return `x-safari-https://${url.slice("https://".length)}`;
  }
  if (url.startsWith("http://")) {
    return `x-safari-http://${url.slice("http://".length)}`;
  }
  return url;
}

function navigateWithAnchor(href: string): void {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.rel = "noopener noreferrer";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function openExternalUrl(
  url: string,
  deps: {
    assign?: (href: string) => void;
    replace?: (href: string) => void;
    open?: (href: string, target: string, features?: string) => Window | null;
    clickAnchor?: (href: string) => void;
    standalone?: boolean;
    android?: boolean;
    ios?: boolean;
  } = {},
): void {
  const assign = deps.assign ?? ((href) => window.location.assign(href));
  const replace = deps.replace ?? ((href) => window.location.replace(href));
  const open = deps.open ?? ((href, target, features) => window.open(href, target, features));
  const clickAnchor = deps.clickAnchor ?? navigateWithAnchor;
  const standalone = deps.standalone ?? isStandaloneDisplay();
  const android = deps.android ?? isAndroidUserAgent();
  const ios = deps.ios ?? isIOSUserAgent();

  if (isInAppRedirect(url)) {
    replace(url);
    return;
  }

  if (!standalone) {
    replace(url);
    return;
  }

  if (android) {
    // Chrome rewrites location.assign(intent://) back to https inside the PWA.
    // A clicked <a href> is handed to the Android intent resolver instead.
    clickAnchor(toAndroidIntentUrl(url));
    return;
  }

  if (ios) {
    assign(toIOSSafariUrl(url));
    return;
  }

  const popup = open(url, "_blank", "noopener,noreferrer");
  if (popup) {
    return;
  }

  clickAnchor(url);
}
