import { openExternal, toAndroidIntentUrl, _location } from "./UrlOpener";

describe("UrlOpener", () => {
  describe("toAndroidIntentUrl", () => {
    test("converts standard https URL", () => {
      expect(toAndroidIntentUrl("https://www.google.com/search?q=test")).toBe(
        "intent://www.google.com/search?q=test" +
          "#Intent;scheme=https;" +
          "action=android.intent.action.VIEW;" +
          "category=android.intent.category.BROWSABLE;" +
          "launchFlags=0x10000000;" +
          "S.browser_fallback_url=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dtest;" +
          "end"
      );
    });

    test("converts standard https URL for Android Chrome", () => {
      const originalUserAgent = navigator.userAgent;
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Mobile Safari/537.36",
        configurable: true,
        writable: true,
      });
      expect(toAndroidIntentUrl("https://www.google.com/search?q=test")).toBe(
        "intent://www.google.com/search?q=test" +
          "#Intent;scheme=https;" +
          "component=com.android.chrome/com.google.android.apps.chrome.Main;" +
          "action=android.intent.action.VIEW;" +
          "category=android.intent.category.BROWSABLE;" +
          "launchFlags=0x10000000;" +
          "S.browser_fallback_url=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dtest;" +
          "end"
      );
      Object.defineProperty(navigator, "userAgent", {
        value: originalUserAgent,
        configurable: true,
        writable: true,
      });
    });

    test("converts http URL", () => {
      expect(toAndroidIntentUrl("http://example.com/foo")).toBe(
        "intent://example.com/foo" +
          "#Intent;scheme=http;" +
          "action=android.intent.action.VIEW;" +
          "category=android.intent.category.BROWSABLE;" +
          "launchFlags=0x10000000;" +
          "S.browser_fallback_url=http%3A%2F%2Fexample.com%2Ffoo;" +
          "end"
      );
    });

    test("returns null for non-http/https URL", () => {
      expect(toAndroidIntentUrl("mailto:test@example.com")).toBeNull();
      expect(toAndroidIntentUrl("javascript:alert(1)")).toBeNull();
    });

    test("returns null for unparseable URL", () => {
      expect(toAndroidIntentUrl("not-a-url")).toBeNull();
    });
  });

  describe("openExternal", () => {
    const originalMatchMedia = window.matchMedia;
    const originalUserAgent = navigator.userAgent;
    let replaceSpy: jest.SpyInstance;
    let hrefSetSpy: jest.SpyInstance;
    let hrefGetSpy: jest.SpyInstance;
    let hrefValue = "";

    beforeEach(() => {
      hrefValue = "";
      
      // Spy/Mock getters and setters on the exported _location object
      hrefSetSpy = jest.spyOn(_location, "href", "set").mockImplementation((val) => {
        hrefValue = val;
      });
      hrefGetSpy = jest.spyOn(_location, "href", "get").mockImplementation(() => {
        return hrefValue;
      });
      replaceSpy = jest.spyOn(_location, "replace").mockImplementation(() => {});

      // Default matchMedia mock
      window.matchMedia = jest.fn().mockImplementation(() => ({
        matches: false,
      })) as any;

      // Default userAgent mock
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0",
        configurable: true,
        writable: true,
      });
    });

    afterEach(() => {
      // Clean up spies
      hrefSetSpy.mockRestore();
      hrefGetSpy.mockRestore();
      replaceSpy.mockRestore();

      // Clean up other mocks
      window.matchMedia = originalMatchMedia;
      Object.defineProperty(navigator, "userAgent", {
        value: originalUserAgent,
        configurable: true,
        writable: true,
      });
    });

    test("uses standard location href navigation when not in Android PWA", () => {
      openExternal("https://example.com");
      expect(hrefValue).toBe("https://example.com");
    });

    test("uses location replace when specified", () => {
      openExternal("https://example.com", true);
      expect(replaceSpy).toHaveBeenCalledWith("https://example.com");
    });

    test("uses Android intent URL and redirects PWA shell when in Android PWA with replace = true", () => {
      jest.useFakeTimers();

      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === "(display-mode: standalone)",
      })) as any;

      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36",
        configurable: true,
        writable: true,
      });

      openExternal("https://example.com/search?q=test", true);

      expect(hrefValue).toBe(
        "intent://example.com/search?q=test#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;launchFlags=0x10000000;S.browser_fallback_url=https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dtest;end"
      );
      expect(replaceSpy).not.toHaveBeenCalled();

      jest.advanceTimersByTime(150);
      expect(replaceSpy).toHaveBeenCalledWith("../index.html");

      jest.useRealTimers();
    });

    test("uses Android intent URL but no redirect when in Android PWA with replace = false", () => {
      jest.useFakeTimers();

      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === "(display-mode: standalone)",
      })) as any;

      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36",
        configurable: true,
        writable: true,
      });

      openExternal("https://example.com/search?q=test", false);

      expect(hrefValue).toBe(
        "intent://example.com/search?q=test#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;launchFlags=0x10000000;S.browser_fallback_url=https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dtest;end"
      );

      jest.advanceTimersByTime(150);
      expect(replaceSpy).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });
});
