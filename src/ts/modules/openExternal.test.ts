import {
  isInAppRedirect,
  isAndroidUserAgent,
  isIOSUserAgent,
  openExternalUrl,
  toAndroidIntentUrl,
  toIOSSafariUrl,
} from "./openExternal";

describe("openExternal", () => {
  test("toAndroidIntentUrl uses a new-document launch so Chrome cannot keep the PWA task", () => {
    expect(toAndroidIntentUrl("https://www.google.com/search?q=foo")).toBe(
      "intent://www.google.com/search?q=foo#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;launchFlags=0x18080000;end",
    );
  });

  test("toIOSSafariUrl wraps https", () => {
    expect(toIOSSafariUrl("https://www.google.com/search?q=g")).toBe(
      "x-safari-https://www.google.com/search?q=g",
    );
  });

  test("isInAppRedirect keeps homepage fallbacks inside the PWA", () => {
    expect(isInAppRedirect("../index.html#status=not_found")).toBe(true);
    expect(isInAppRedirect("https://www.google.com")).toBe(false);
  });

  test("user-agent helpers", () => {
    expect(isAndroidUserAgent("Mozilla/5.0 (Linux; Android 14; Pixel)")).toBe(true);
    expect(isIOSUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(true);
    expect(isAndroidUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)")).toBe(false);
  });

  test("openExternalUrl clicks an intent:// anchor on Android standalone PWA", () => {
    const clickAnchor = jest.fn();
    const assign = jest.fn();
    const replace = jest.fn();
    openExternalUrl("https://www.google.com/search?q=g", {
      clickAnchor,
      assign,
      replace,
      standalone: true,
      android: true,
      ios: false,
    });
    expect(clickAnchor).toHaveBeenCalledWith(
      "intent://www.google.com/search?q=g#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;launchFlags=0x18080000;end",
    );
    expect(assign).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  test("openExternalUrl stays in-app for homepage fallbacks", () => {
    const replace = jest.fn();
    openExternalUrl("../index.html#status=not_found", {
      replace,
      standalone: true,
      android: true,
    });
    expect(replace).toHaveBeenCalledWith("../index.html#status=not_found");
  });

  test("openExternalUrl uses window.open on desktop standalone PWA", () => {
    const open = jest.fn().mockReturnValue({});
    const replace = jest.fn();
    openExternalUrl("https://www.google.com", {
      open,
      replace,
      standalone: true,
      android: false,
      ios: false,
    });
    expect(open).toHaveBeenCalledWith("https://www.google.com", "_blank", "noopener,noreferrer");
    expect(replace).not.toHaveBeenCalled();
  });

  test("openExternalUrl uses location.replace in a normal browser tab", () => {
    const replace = jest.fn();
    openExternalUrl("https://www.google.com", {
      replace,
      standalone: false,
      android: true,
    });
    expect(replace).toHaveBeenCalledWith("https://www.google.com");
  });
});
