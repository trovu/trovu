/** @module TargetOpener */
import { describe, expect, it } from "@jest/globals";
import { decideTargetOpen, isOutOfScope, openExternalLink, openTargetUrl } from "./TargetOpener";

const APP_ORIGIN = "https://trovu.net";

describe("TargetOpener", () => {
  describe("isOutOfScope", () => {
    it("treats an absolute URL on another host as out of scope", () => {
      expect(isOutOfScope("https://www.google.com/search?q=test", APP_ORIGIN)).toBe(true);
    });

    it("treats an absolute URL on the app itself as in scope", () => {
      expect(isOutOfScope("https://trovu.net/#/redirect", APP_ORIGIN)).toBe(false);
    });

    it("treats a relative URL as in scope", () => {
      expect(isOutOfScope("/#/redirect", APP_ORIGIN)).toBe(false);
    });
  });

  describe("decideTargetOpen", () => {
    it("does nothing when there is no URL", () => {
      expect(decideTargetOpen(undefined, { isStandalone: true, appOrigin: APP_ORIGIN })).toEqual({
        type: "none",
      });
      expect(decideTargetOpen("", { isStandalone: true, appOrigin: APP_ORIGIN })).toEqual({ type: "none" });
    });

    it("navigates in the current window when not running as an installed PWA", () => {
      const action = decideTargetOpen("https://www.google.com/search?q=test", {
        isStandalone: false,
        appOrigin: APP_ORIGIN,
      });
      expect(action).toEqual({ type: "navigate", url: "https://www.google.com/search?q=test" });
    });

    it("navigates in the current window for a URL inside the app scope", () => {
      const action = decideTargetOpen("https://trovu.net/#/redirect", {
        isStandalone: true,
        appOrigin: APP_ORIGIN,
      });
      expect(action).toEqual({ type: "navigate", url: "https://trovu.net/#/redirect" });
    });

    it("hands a URL outside the app scope to the operating system in an installed PWA", () => {
      const action = decideTargetOpen("https://www.google.com/search?q=test", {
        isStandalone: true,
        appOrigin: APP_ORIGIN,
      });
      expect(action).toEqual({ type: "external", url: "https://www.google.com/search?q=test" });
    });

    it("hands a URL of an app scheme to the operating system in an installed PWA", () => {
      const action = decideTargetOpen("https://maps.google.com/?q=test", {
        isStandalone: true,
        appOrigin: APP_ORIGIN,
      });
      expect(action).toEqual({ type: "external", url: "https://maps.google.com/?q=test" });
    });
  });

  describe("openTargetUrl", () => {
    it("navigates in the current window and does not hand anything over", () => {
      const navigated: string[] = [];
      const external: string[] = [];
      const action = openTargetUrl("https://www.google.com/search?q=test", {
        isStandalone: false,
        appOrigin: APP_ORIGIN,
        navigate: (url) => navigated.push(url),
        openExternal: (url) => external.push(url),
      });
      expect(action).toEqual({ type: "navigate", url: "https://www.google.com/search?q=test" });
      expect(navigated).toEqual(["https://www.google.com/search?q=test"]);
      expect(external).toEqual([]);
    });

    it("hands the URL over to the operating system in an installed PWA", () => {
      const navigated: string[] = [];
      const external: string[] = [];
      const action = openTargetUrl("https://www.google.com/search?q=test", {
        isStandalone: true,
        appOrigin: APP_ORIGIN,
        navigate: (url) => navigated.push(url),
        openExternal: (url) => external.push(url),
      });
      expect(action).toEqual({ type: "external", url: "https://www.google.com/search?q=test" });
      expect(navigated).toEqual([]);
      expect(external).toEqual(["https://www.google.com/search?q=test"]);
    });

    it("keeps the user in the app for an in-scope URL", () => {
      const navigated: string[] = [];
      const external: string[] = [];
      openTargetUrl("https://trovu.net/#/redirect", {
        isStandalone: true,
        appOrigin: APP_ORIGIN,
        navigate: (url) => navigated.push(url),
        openExternal: (url) => external.push(url),
      });
      expect(navigated).toEqual(["https://trovu.net/#/redirect"]);
      expect(external).toEqual([]);
    });

    it("keeps the hop to the in-app process page inside the app in standalone mode", () => {
      const navigated: string[] = [];
      const external: string[] = [];
      openTargetUrl("https://trovu.net/process/index.html#query=g", {
        isStandalone: true,
        appOrigin: APP_ORIGIN,
        navigate: (url) => navigated.push(url),
        openExternal: (url) => external.push(url),
      });
      expect(navigated).toEqual(["https://trovu.net/process/index.html#query=g"]);
      expect(external).toEqual([]);
    });

    it("does nothing without a URL", () => {
      const navigated: string[] = [];
      const external: string[] = [];
      const action = openTargetUrl(undefined, {
        isStandalone: true,
        appOrigin: APP_ORIGIN,
        navigate: (url) => navigated.push(url),
        openExternal: (url) => external.push(url),
      });
      expect(action).toEqual({ type: "none" });
      expect(navigated).toEqual([]);
      expect(external).toEqual([]);
    });
  });

  describe("openExternalLink", () => {
    it("follows a link that opens in a new context and leaves nothing behind", () => {
      const clicked: string[] = [];
      const originalClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function click(this: HTMLAnchorElement) {
        clicked.push(this.href);
        expect(this.target).toBe("_blank");
        expect(this.rel).toBe("noopener noreferrer");
      };
      try {
        openExternalLink("https://www.google.com/search?q=test");
      } finally {
        HTMLAnchorElement.prototype.click = originalClick;
      }
      expect(clicked).toEqual(["https://www.google.com/search?q=test"]);
      expect(document.querySelectorAll("a[target=\"_blank\"]").length).toBe(0);
    });
  });
});
