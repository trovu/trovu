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
  test("isExternalHttpUrl identifies external http(s) URLs and ignores internal/mailto URLs", () => {
    expect(CallHandler.isExternalHttpUrl("https://www.google.com/")).toBe(true);
    expect(CallHandler.isExternalHttpUrl("http://example.com/search?q=test")).toBe(true);
    expect(CallHandler.isExternalHttpUrl("../index.html#status=not_found")).toBe(false);
    expect(CallHandler.isExternalHttpUrl("/index.html")).toBe(false);
    expect(CallHandler.isExternalHttpUrl("mailto:test@example.com")).toBe(false);
  });
  test("buildAndroidIntentUrl formats Android intent URI with browser_fallback_url", () => {
    expect(CallHandler.buildAndroidIntentUrl("https://www.google.com/search?q=foo")).toBe(
      "intent://www.google.com/search?q=foo#Intent;scheme=https;" +
        "action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;" +
        "S.browser_fallback_url=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dfoo;end",
    );
    expect(CallHandler.buildAndroidIntentUrl("mailto:test@example.com")).toBe("mailto:test@example.com");
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
