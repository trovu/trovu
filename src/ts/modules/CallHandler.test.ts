import CallHandler from "./CallHandler";
import Env from "./Env";

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
  describe("standalone external navigation", () => {
    const standaloneEnv = {
      isRunningStandalone: jest.fn(() => true),
    };
    const browserEnv = {
      isRunningStandalone: jest.fn(() => false),
    };

    test("opens external HTTP URLs outside standalone PWA", () => {
      expect(CallHandler.shouldOpenExternally("https://www.google.com/search?q=test", standaloneEnv)).toBe(true);
    });

    test("keeps same-origin URLs inside standalone PWA", () => {
      expect(CallHandler.shouldOpenExternally("../index.html#language=en", standaloneEnv)).toBe(false);
      expect(CallHandler.shouldOpenExternally(`${window.location.origin}/process/index.html`, standaloneEnv)).toBe(
        false,
      );
    });

    test("keeps all URLs inside normal browser tabs", () => {
      expect(CallHandler.shouldOpenExternally("https://www.google.com/search?q=test", browserEnv)).toBe(false);
    });

    test("uses window.open for external standalone redirects", () => {
      window.open = jest.fn();

      CallHandler.openUrl("https://www.google.com/search?q=test", standaloneEnv);

      expect(window.open).toHaveBeenCalledWith("https://www.google.com/search?q=test", "_blank", "noopener,noreferrer");
    });
  });
});
