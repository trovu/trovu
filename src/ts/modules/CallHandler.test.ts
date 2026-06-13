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
  test("getNavigationUrl keeps regular browser redirects unchanged", () => {
    const androidSpy = jest.spyOn(CallHandler, "isAndroid").mockReturnValue(true);
    const env = {
      isRunningStandalone: () => false,
    };

    expect(CallHandler.getNavigationUrl("https://www.google.com/search?q=foo", env)).toBe(
      "https://www.google.com/search?q=foo",
    );

    androidSpy.mockRestore();
  });
  test("getNavigationUrl uses Android intents for standalone PWA web redirects", () => {
    const androidSpy = jest.spyOn(CallHandler, "isAndroid").mockReturnValue(true);
    const env = {
      isRunningStandalone: () => true,
    };

    expect(CallHandler.getNavigationUrl("https://www.google.com/search?q=foo", env)).toBe(
      "intent://www.google.com/search?q=foo#Intent;scheme=https;S.browser_fallback_url=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dfoo;end",
    );

    androidSpy.mockRestore();
  });
  test("getNavigationUrl does not use Android intents for mailto redirects", () => {
    const androidSpy = jest.spyOn(CallHandler, "isAndroid").mockReturnValue(true);
    const env = {
      isRunningStandalone: () => true,
    };

    expect(CallHandler.getNavigationUrl("mailto:test@example.com", env)).toBe("mailto:test@example.com");

    androidSpy.mockRestore();
  });
});
