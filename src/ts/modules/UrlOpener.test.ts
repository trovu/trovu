import { openExternal, toAndroidIntentUrl } from "./UrlOpener";

describe("UrlOpener", () => {
  describe("toAndroidIntentUrl", () => {
    test("converts standard https URL", () => {
      expect(toAndroidIntentUrl("https://www.google.com/search?q=test")).toBe(
        "intent://www.google.com/search?q=test" +
          "#Intent;scheme=https;" +
          "action=android.intent.action.VIEW;" +
          "category=android.intent.category.BROWSABLE;" +
          "end"
      );
    });

    test("converts http URL", () => {
      expect(toAndroidIntentUrl("http://example.com/foo")).toBe(
        "intent://example.com/foo" +
          "#Intent;scheme=http;" +
          "action=android.intent.action.VIEW;" +
          "category=android.intent.category.BROWSABLE;" +
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
    let originalWindow: typeof window;
    let originalNavigator: typeof navigator;

    beforeEach(() => {
      originalWindow = global.window;
      originalNavigator = global.navigator;
    });

    afterEach(() => {
      global.window = originalWindow;
      global.navigator = originalNavigator;
    });

    test("uses standard location href navigation when not in Android PWA", () => {
      const mockLocation = { href: "", replace: jest.fn() };
      global.window = {
        location: mockLocation,
        matchMedia: () => ({ matches: false }),
      } as any;
      global.navigator = { userAgent: "Mozilla/5.0" } as any;

      openExternal("https://example.com");
      expect(mockLocation.href).toBe("https://example.com");
    });

    test("uses location replace when specified", () => {
      const mockLocation = { href: "", replace: jest.fn() };
      global.window = {
        location: mockLocation,
        matchMedia: () => ({ matches: false }),
      } as any;
      global.navigator = { userAgent: "Mozilla/5.0" } as any;

      openExternal("https://example.com", true);
      expect(mockLocation.replace).toHaveBeenCalledWith("https://example.com");
    });
  });
});
