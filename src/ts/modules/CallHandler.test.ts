import CallHandler from "./CallHandler";
import Env from "./Env";
import ShortcutFinder from "./ShortcutFinder";
import { createLogger } from "../../../tests/createLogger";
import type { Shortcut } from "../types";

describe("CallHandler", () => {
  test("getAlternative", async () => {
    const shortcut = {
      deprecated: {
        alternative: {
          query: "gm b,<1>",
        },
      },
    };
    const env = {
      args: ["brandenburger tor"],
    };
    expect(CallHandler.getAlternative(shortcut, env)).toEqual("gm b,brandenburger tor");
  });
  test("getRedirectUrlToHome", async () => {
    Env.getUrlHash = () => {
      return "country=at&language=de&query=reload";
    };
    const response = {
      status: "reloaded",
    };
    expect(CallHandler.getRedirectUrlToHome(new Env(), response)).toStrictEqual(
      "../index.html#country=at&language=de&status=reloaded",
    );
  });
  test("getRedirectUrlToHome keeps the populated query over the stale URL query", async () => {
    Env.getUrlHash = () => {
      return "country=gb&language=de&query=google&status=not_found";
    };
    const response = {
      status: "not_found",
    };
    expect(CallHandler.getRedirectUrlToHome(new Env({ query: "wikipedia" }), response)).toStrictEqual(
      "../index.html#country=gb&language=de&query=wikipedia&status=not_found",
    );
  });
  test("isSafeRedirectUrl allows http, https and mailto", () => {
    expect(CallHandler.isSafeRedirectUrl("http://example.com")).toBe(true);
    expect(CallHandler.isSafeRedirectUrl("https://example.com")).toBe(true);
    expect(CallHandler.isSafeRedirectUrl("mailto:test@example.com")).toBe(true);
  });
  test("isSafeRedirectUrl blocks unsupported protocols", () => {
    expect(CallHandler.isSafeRedirectUrl("javascript:alert(1)")).toBe(false);
  });
  test("isSafeRedirectUrl blocks unparseable URLs", () => {
    expect(CallHandler.isSafeRedirectUrl("not a url")).toBe(false);
  });
  test("getRedirectResponse returns suspicious for blocked redirect URLs", () => {
    const shortcutSpy = jest.spyOn(ShortcutFinder, "findShortcut").mockReturnValue({
      url: "javascript:alert(1)",
      reachable: true,
    } as Shortcut);
    const env = {
      query: "evil",
      args: [],
      language: "en",
      country: "us",
      logger: createLogger(),
    };

    expect(CallHandler.getRedirectResponse(env)).toMatchObject({
      status: "suspicious",
      redirectUrl: "javascript:alert(1)",
    });

    shortcutSpy.mockRestore();
  });
});

describe("CallHandler PWA navigation (issue #329: escape the standalone PWA)", () => {
  function setUserAgent(userAgent: string) {
    Object.defineProperty(window.navigator, "userAgent", {
      value: userAgent,
      configurable: true,
    });
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("getPlatform detects Android", () => {
    setUserAgent("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36");
    expect(CallHandler.getPlatform()).toBe("android");
  });

  test("getPlatform detects iOS", () => {
    setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)");
    expect(CallHandler.getPlatform()).toBe("ios");
  });

  test("getPlatform falls back to other", () => {
    setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)");
    expect(CallHandler.getPlatform()).toBe("other");
  });

  test("buildAndroidIntentUrl wraps http(s) URLs with a browser fallback", () => {
    const intentUrl = CallHandler.buildAndroidIntentUrl("https://www.google.com/search?q=hi");
    expect(intentUrl).toMatch(/^intent:\/\/www\.google\.com\/search\?q=hi#Intent;/);
    expect(intentUrl).toContain("scheme=https;");
    expect(intentUrl).toContain(
      "S.browser_fallback_url=" + encodeURIComponent("https://www.google.com/search?q=hi"),
    );
    expect(intentUrl).toMatch(/;end$/);
  });

  test("buildAndroidIntentUrl returns null for non-http(s) protocols", () => {
    expect(CallHandler.buildAndroidIntentUrl("mailto:test@example.com")).toBeNull();
  });

  test("buildAndroidIntentUrl returns null for unparseable URLs", () => {
    expect(CallHandler.buildAndroidIntentUrl("not a url")).toBeNull();
  });

  test("getIosExternalUrl prefixes https URLs with x-safari-", () => {
    expect(CallHandler.getIosExternalUrl("https://example.com/x")).toBe("x-safari-https://example.com/x");
  });

  test("getIosExternalUrl returns null for non-https URLs", () => {
    expect(CallHandler.getIosExternalUrl("http://example.com/x")).toBeNull();
    expect(CallHandler.getIosExternalUrl("mailto:test@example.com")).toBeNull();
  });

  test("clickLink creates, clicks, and removes a temporary anchor", () => {
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    CallHandler.clickLink("intent://example.com#Intent;end");
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(document.querySelectorAll("a[href^='intent://']").length).toBe(0);
  });

  test("openExternally clicks an intent link on Android", () => {
    setUserAgent("Mozilla/5.0 (Linux; Android 14; Pixel 8)");
    const clickLinkSpy = jest.spyOn(CallHandler, "clickLink").mockImplementation(() => {});
    const navigate = jest.fn();
    CallHandler.openExternally("https://www.google.com/search?q=hi", navigate);
    expect(clickLinkSpy).toHaveBeenCalledWith(expect.stringMatching(/^intent:\/\//));
    expect(navigate).not.toHaveBeenCalled();
  });

  test("openExternally navigates to an x-safari- URL on iOS", () => {
    setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)");
    const navigate = jest.fn();
    CallHandler.openExternally("https://www.google.com/search?q=hi", navigate);
    expect(navigate).toHaveBeenCalledWith("x-safari-https://www.google.com/search?q=hi");
  });

  test("openExternally falls back to plain navigate elsewhere (e.g. mailto, desktop)", () => {
    setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)");
    const navigate = jest.fn();
    CallHandler.openExternally("mailto:test@example.com", navigate);
    expect(navigate).toHaveBeenCalledWith("mailto:test@example.com");
  });

  test("redirectTo navigates directly for internal redirects, even when standalone", () => {
    jest.spyOn(Env, "isRunningStandalone").mockReturnValue(true);
    const navigate = jest.fn();
    CallHandler.redirectTo("../index.html#status=not_found", false, navigate);
    expect(navigate).toHaveBeenCalledWith("../index.html#status=not_found");
  });

  test("redirectTo navigates directly for external targets when not standalone", () => {
    jest.spyOn(Env, "isRunningStandalone").mockReturnValue(false);
    const navigate = jest.fn();
    CallHandler.redirectTo("https://www.google.com/search?q=hi", true, navigate);
    expect(navigate).toHaveBeenCalledWith("https://www.google.com/search?q=hi");
  });

  test("redirectTo escapes the PWA for external targets when standalone", () => {
    jest.spyOn(Env, "isRunningStandalone").mockReturnValue(true);
    const openExternallySpy = jest.spyOn(CallHandler, "openExternally").mockImplementation(() => {});
    const navigate = jest.fn();
    CallHandler.redirectTo("https://www.google.com/search?q=hi", true, navigate);
    expect(openExternallySpy).toHaveBeenCalledWith("https://www.google.com/search?q=hi", navigate);
    expect(navigate).not.toHaveBeenCalled();
  });
});
