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
  test("getPlatform detects android", () => {
    expect(CallHandler.getPlatform("Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/126")).toBe("android");
  });
  test("getPlatform detects ios", () => {
    expect(CallHandler.getPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1")).toBe(
      "ios",
    );
  });
  test("getPlatform falls back to other", () => {
    expect(CallHandler.getPlatform("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("other");
  });

  test("buildAndroidIntentUrl builds an intent URL with a browser fallback", () => {
    const intentUrl = CallHandler.buildAndroidIntentUrl("https://www.google.com/search?q=trovu");
    expect(intentUrl).toBe(
      "intent://www.google.com/search?q=trovu#Intent;" +
        "scheme=https;" +
        "action=android.intent.action.VIEW;" +
        "category=android.intent.category.BROWSABLE;" +
        "launchFlags=0x18080000;" +
        "S.browser_fallback_url=" +
        encodeURIComponent("https://www.google.com/search?q=trovu") +
        ";end",
    );
  });
  test("buildAndroidIntentUrl supports http", () => {
    expect(CallHandler.buildAndroidIntentUrl("http://example.com")?.startsWith("intent://example.com#Intent;")).toBe(
      true,
    );
  });
  test("buildAndroidIntentUrl returns null for non-http(s) URLs", () => {
    expect(CallHandler.buildAndroidIntentUrl("mailto:test@example.com")).toBeNull();
  });
  test("buildAndroidIntentUrl returns null for unparseable URLs", () => {
    expect(CallHandler.buildAndroidIntentUrl("not a url")).toBeNull();
  });

  test("getIosExternalUrl prefixes https URLs with x-safari-", () => {
    expect(CallHandler.getIosExternalUrl("https://www.google.com/search?q=trovu")).toBe(
      "x-safari-https://www.google.com/search?q=trovu",
    );
  });
  test("getIosExternalUrl returns null for non-https URLs", () => {
    expect(CallHandler.getIosExternalUrl("http://example.com")).toBeNull();
    expect(CallHandler.getIosExternalUrl("mailto:test@example.com")).toBeNull();
  });

  test("redirectTo falls back to location.replace outside standalone PWAs", () => {
    const replaceSpy = jest.spyOn(CallHandler, "locationReplace").mockImplementation(() => {});

    CallHandler.redirectTo({ isRunningStandalone: () => false }, "https://example.com");

    expect(replaceSpy).toHaveBeenCalledWith("https://example.com");

    replaceSpy.mockRestore();
  });

  test("redirectTo clicks an intent link on standalone Android", () => {
    const userAgentSpy = jest
      .spyOn(window.navigator, "userAgent", "get")
      .mockReturnValue("Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/126");
    const clickLinkSpy = jest.spyOn(CallHandler, "clickLink").mockImplementation(() => {});

    CallHandler.redirectTo({ isRunningStandalone: () => true }, "https://example.com");

    expect(clickLinkSpy).toHaveBeenCalledWith(expect.stringContaining("intent://example.com#Intent;"));

    clickLinkSpy.mockRestore();
    userAgentSpy.mockRestore();
  });

  test("redirectTo navigates via x-safari-https on standalone iOS", () => {
    const userAgentSpy = jest
      .spyOn(window.navigator, "userAgent", "get")
      .mockReturnValue("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1");
    const hrefSpy = jest.spyOn(CallHandler, "locationSetHref").mockImplementation(() => {});

    CallHandler.redirectTo({ isRunningStandalone: () => true }, "https://example.com");

    expect(hrefSpy).toHaveBeenCalledWith("x-safari-https://example.com");

    hrefSpy.mockRestore();
    userAgentSpy.mockRestore();
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