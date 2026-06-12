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
  test("getAndroidIntentUrl converts http and https URLs on Android", () => {
    jest.spyOn(CallHandler, "isAndroid").mockReturnValue(true);

    expect(CallHandler.getAndroidIntentUrl("https://www.google.com/search?q=trovu")).toBe(
      "intent://www.google.com/search?q=trovu#Intent;scheme=https;action=android.intent.action.VIEW;end",
    );
    expect(CallHandler.getAndroidIntentUrl("http://example.com/path")).toBe(
      "intent://example.com/path#Intent;scheme=http;action=android.intent.action.VIEW;end",
    );

    jest.restoreAllMocks();
  });
  test("getAndroidIntentUrl does not convert non-web URLs", () => {
    jest.spyOn(CallHandler, "isAndroid").mockReturnValue(true);

    expect(CallHandler.getAndroidIntentUrl("mailto:test@example.com")).toBe(false);

    jest.restoreAllMocks();
  });
  test("getAndroidIntentUrl only converts on Android", () => {
    jest.spyOn(CallHandler, "isAndroid").mockReturnValue(false);

    expect(CallHandler.getAndroidIntentUrl("https://www.google.com/search?q=trovu")).toBe(false);

    jest.restoreAllMocks();
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
