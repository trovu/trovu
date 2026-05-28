type Navigate = (url: string) => void;

function isStandalonePwa(): boolean {
  return Boolean(window.navigator.standalone) || Boolean(window.matchMedia?.("(display-mode: standalone)").matches);
}

function isAndroid(): boolean {
  return /Android/i.test(window.navigator.userAgent);
}

export function getAndroidIntentUrl(url: string): string | false {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return false;
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return false;
  }

  const scheme = parsedUrl.protocol.slice(0, -1);
  const target = `${parsedUrl.host}${parsedUrl.pathname}${parsedUrl.search}`;
  const fallbackUrl = encodeURIComponent(url);
  return `intent://${target}#Intent;scheme=${scheme};S.browser_fallback_url=${fallbackUrl};end`;
}

export function getExternalNavigationUrl(url: string): string {
  if (typeof window === "undefined" || !isStandalonePwa() || !isAndroid()) {
    return url;
  }

  return getAndroidIntentUrl(url) || url;
}

export function navigateExternalUrl(url: string, navigate: Navigate = (targetUrl) => window.location.assign(targetUrl)) {
  navigate(getExternalNavigationUrl(url));
}
