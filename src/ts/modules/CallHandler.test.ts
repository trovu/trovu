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

  describe("PWA external redirect", () => {
    test("getPlatform detects android, ios, and other user agents", () => {
      expect(CallHandler.getPlatform("Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/124.0")).toBe("android");
      expect(CallHandler.getPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe("ios");
      expect(CallHandler.getPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")).toBe("other");
      expect(CallHandler.getPlatform("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("other");
    });

    test("buildAndroidIntentUrl wraps http and https URLs", () => {
      expect(CallHandler.buildAndroidIntentUrl("https://www.google.com/search?q=test")).toBe(
        "intent://www.google.com/search?q=test#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;launchFlags=0x10000000;S.browser_fallback_url=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dtest;end",
      );
      expect(CallHandler.buildAndroidIntentUrl("http://example.com/foo")).toBe(
        "intent://example.com/foo#Intent;scheme=http;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;launchFlags=0x10000000;S.browser_fallback_url=http%3A%2F%2Fexample.com%2Ffoo;end",
      );
    });

    test("buildAndroidIntentUrl returns null for non-http(s) and invalid URLs", () => {
      expect(CallHandler.buildAndroidIntentUrl("mailto:user@example.com")).toBeNull();
      expect(CallHandler.buildAndroidIntentUrl("not a url")).toBeNull();
      expect(CallHandler.buildAndroidIntentUrl("../index.html#status=not_found")).toBeNull();
    });

    test("getIosExternalUrl prefixes http(s) URLs with x-safari-", () => {
      expect(CallHandler.getIosExternalUrl("https://www.google.com/")).toBe("x-safari-https://www.google.com/");
      expect(CallHandler.getIosExternalUrl("http://example.com/")).toBe("x-safari-http://example.com/");
      expect(CallHandler.getIosExternalUrl("mailto:user@example.com")).toBeNull();
    });

    test("clickLink creates and clicks a temporary link element", () => {
      const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
      CallHandler.clickLink("https://example.com", "_blank");
      expect(clickSpy).toHaveBeenCalled();
      clickSpy.mockRestore();
    });

    test("redirectTo navigates directly when not standalone", () => {
      jest.spyOn(Env, "isRunningStandalone").mockReturnValue(false);
      const navigate = jest.fn();
      CallHandler.redirectTo("https://www.google.com", true, navigate);
      expect(navigate).toHaveBeenCalledWith("https://www.google.com");
    });

    test("redirectTo navigates directly when not an external target even if standalone", () => {
      jest.spyOn(Env, "isRunningStandalone").mockReturnValue(true);
      const navigate = jest.fn();
      CallHandler.redirectTo("../index.html#status=not_found", false, navigate);
      expect(navigate).toHaveBeenCalledWith("../index.html#status=not_found");
    });

    test("redirectTo calls openExternally when standalone and external target", () => {
      jest.spyOn(Env, "isRunningStandalone").mockReturnValue(true);
      const openExternallySpy = jest.spyOn(CallHandler, "openExternally").mockImplementation(() => {});
      const navigate = jest.fn();
      CallHandler.redirectTo("https://www.google.com", true, navigate);
      expect(openExternallySpy).toHaveBeenCalledWith("https://www.google.com", navigate);
      expect(navigate).not.toHaveBeenCalled();
      openExternallySpy.mockRestore();
    });

    test("openExternally on Android triggers intent click", () => {
      jest.spyOn(CallHandler, "getPlatform").mockReturnValue("android");
      const clickLinkSpy = jest.spyOn(CallHandler, "clickLink").mockImplementation(() => {});
      const navigate = jest.fn();
      CallHandler.openExternally("https://www.google.com", navigate);
      expect(clickLinkSpy).toHaveBeenCalledWith(
        expect.stringContaining("intent://www.google.com"),
        "_blank",
      );
      clickLinkSpy.mockRestore();
    });

    test("openExternally on iOS navigates to x-safari- URL", () => {
      jest.spyOn(CallHandler, "getPlatform").mockReturnValue("ios");
      const navigate = jest.fn();
      CallHandler.openExternally("https://www.google.com", navigate);
      expect(navigate).toHaveBeenCalledWith("x-safari-https://www.google.com");
    });

    test("openExternally on other platforms opens via window.open", () => {
      jest.spyOn(CallHandler, "getPlatform").mockReturnValue("other");
      const windowOpenSpy = jest.spyOn(window, "open").mockReturnValue({} as Window);
      const clickLinkSpy = jest.spyOn(CallHandler, "clickLink").mockImplementation(() => {});
      const navigate = jest.fn();
      CallHandler.openExternally("https://www.google.com", navigate);
      expect(windowOpenSpy).toHaveBeenCalledWith("https://www.google.com", "_blank", "noopener,noreferrer");
      expect(clickLinkSpy).not.toHaveBeenCalled();
      windowOpenSpy.mockRestore();
      clickLinkSpy.mockRestore();
    });
  });
});
