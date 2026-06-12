import { openExternal, toAndroidIntentUrl } from "./UrlOpener";

describe("toAndroidIntentUrl", () => {
  test("converts a plain https URL", () => {
    const got = toAndroidIntentUrl("https://www.google.com/search?q=hello+world");
    expect(got).toBe(
      "intent://www.google.com/search?q=hello+world" +
        "#Intent;scheme=https;" +
        "action=android.intent.action.VIEW;" +
        "category=android.intent.category.BROWSABLE;" +
        "end",
    );
  });

  test("preserves http (not https)", () => {
    const got = toAndroidIntentUrl("http://example.com/path");
    expect(got).toBe(
      "intent://example.com/path" +
        "#Intent;scheme=http;" +
        "action=android.intent.action.VIEW;" +
        "category=android.intent.category.BROWSABLE;" +
        "end",
    );
  });

  test("returns null for a non-http(s) scheme", () => {
    expect(toAndroidIntentUrl("mailto:foo@bar.com")).toBeNull();
    expect(toAndroidIntentUrl("javascript:alert(1)")).toBeNull();
    expect(toAndroidIntentUrl("ftp://example.com")).toBeNull();
  });

  test("returns null for an unparseable URL", () => {
    expect(toAndroidIntentUrl("not a url")).toBeNull();
    expect(toAndroidIntentUrl("")).toBeNull();
  });

  test("preserves fragments and query strings verbatim", () => {
    const got = toAndroidIntentUrl(
      "https://example.com/path?a=1&b=2#section",
    );
    expect(got).toContain("intent://example.com/path?a=1&b=2#section");
  });
});

describe("openExternal", () => {
  const originalUserAgent = navigator.userAgent;
  const originalMatchMedia = window.matchMedia;
  let navigated = "";
  const navigate = (url: string) => {
    navigated = url;
  };

  beforeEach(() => {
    navigated = "";
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    Object.defineProperty(navigator, "userAgent", {
      value: originalUserAgent,
      configurable: true,
    });
  });

  function setPwa(value: boolean) {
    window.matchMedia = ((q: string) => ({
      matches: q === "(display-mode: standalone)" ? value : false,
      media: q,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }

  function setUserAgent(ua: string) {
    Object.defineProperty(navigator, "userAgent", {
      value: ua,
      configurable: true,
    });
  }

  test("Android PWA: uses intent:// URL", () => {
    setPwa(true);
    setUserAgent("Mozilla/5.0 (Linux; Android 14; Pixel 7)");
    openExternal("https://duckduckgo.com/?q=hello", navigate);
    expect(navigated).toMatch(/^intent:\/\/duckduckgo\.com\/\?q=hello#Intent/);
  });

  test("Android Chrome tab (not PWA): normal navigation", () => {
    setPwa(false);
    setUserAgent("Mozilla/5.0 (Linux; Android 14; Pixel 7)");
    openExternal("https://duckduckgo.com/?q=hello", navigate);
    expect(navigated).toBe("https://duckduckgo.com/?q=hello");
  });

  test("Desktop PWA: normal navigation (intent only makes sense on Android)", () => {
    setPwa(true);
    setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)");
    openExternal("https://duckduckgo.com/?q=hello", navigate);
    expect(navigated).toBe("https://duckduckgo.com/?q=hello");
  });

  test("iOS Safari PWA: normal navigation (iOS does not understand intent://)", () => {
    setPwa(true);
    setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605",
    );
    openExternal("https://duckduckgo.com/?q=hello", navigate);
    expect(navigated).toBe("https://duckduckgo.com/?q=hello");
  });

  test("Android PWA but unparseable URL: falls through to normal nav", () => {
    setPwa(true);
    setUserAgent("Mozilla/5.0 (Linux; Android 14; Pixel 7)");
    openExternal("not a url", navigate);
    expect(navigated).toBe("not a url");
  });
});
