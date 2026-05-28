import { getAndroidIntentUrl, getExternalNavigationUrl, navigateExternalUrl } from "./ExternalNavigator";

describe("ExternalNavigator", () => {
  const originalMatchMedia = window.matchMedia;
  const originalUserAgent = window.navigator.userAgent;
  const originalStandalone = window.navigator.standalone;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value: originalUserAgent,
    });
    Object.defineProperty(window.navigator, "standalone", {
      configurable: true,
      value: originalStandalone,
    });
  });

  function setDisplayModeStandalone(standalone: boolean) {
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query === "(display-mode: standalone)" ? standalone : false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  }

  function setNavigator(userAgent: string, standalone = false) {
    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value: userAgent,
    });
    Object.defineProperty(window.navigator, "standalone", {
      configurable: true,
      value: standalone,
    });
  }

  test("getAndroidIntentUrl converts http and https URLs", () => {
    expect(getAndroidIntentUrl("https://example.com/search?q=trovu")).toBe(
      "intent://example.com/search?q=trovu#Intent;scheme=https;S.browser_fallback_url=https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dtrovu;end",
    );
    expect(getAndroidIntentUrl("http://example.com/path")).toBe(
      "intent://example.com/path#Intent;scheme=http;S.browser_fallback_url=http%3A%2F%2Fexample.com%2Fpath;end",
    );
  });

  test("getAndroidIntentUrl rejects non-web and invalid URLs", () => {
    expect(getAndroidIntentUrl("mailto:test@example.com")).toBe(false);
    expect(getAndroidIntentUrl("not a url")).toBe(false);
  });

  test("getExternalNavigationUrl uses Android intent URLs only inside Android PWAs", () => {
    setDisplayModeStandalone(true);
    setNavigator("Mozilla/5.0 (Linux; Android 15)");

    expect(getExternalNavigationUrl("https://example.com/search?q=trovu")).toMatch(
      /^intent:\/\/example\.com\/search\?q=trovu#Intent;scheme=https;/,
    );
  });

  test("getExternalNavigationUrl keeps normal browser and non-Android navigation unchanged", () => {
    setDisplayModeStandalone(false);
    setNavigator("Mozilla/5.0 (Linux; Android 15)");
    expect(getExternalNavigationUrl("https://example.com")).toBe("https://example.com");

    setDisplayModeStandalone(true);
    setNavigator("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)");
    expect(getExternalNavigationUrl("https://example.com")).toBe("https://example.com");
  });

  test("getExternalNavigationUrl also recognizes iOS standalone flag but does not generate Android intents", () => {
    setDisplayModeStandalone(false);
    setNavigator("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)", true);

    expect(getExternalNavigationUrl("https://example.com")).toBe("https://example.com");
  });

  test("navigateExternalUrl delegates the resolved URL", () => {
    setDisplayModeStandalone(true);
    setNavigator("Mozilla/5.0 (Linux; Android 15)");
    const navigate = jest.fn();

    navigateExternalUrl("https://example.com", navigate);

    expect(navigate).toHaveBeenCalledWith(expect.stringMatching(/^intent:\/\/example\.com\/#Intent;scheme=https;/));
  });
});
