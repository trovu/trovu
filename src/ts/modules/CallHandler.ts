/** @module CallHandler */
import Env from "./Env";
import GitLogger from "./GitLogger";
import ShortcutFinder from "./ShortcutFinder";
import UrlProcessor from "./UrlProcessor";
import type { EnvLike, RedirectResponse, Shortcut } from "../types";

/** Handle a call. */

export default class CallHandler {
  /**
   * The 'main' function of this class.
   */
  static async handleCall() {
    const targetDomain = document.querySelector<HTMLElement>("#target-domain");
    if (!targetDomain) {
      throw new Error('Missing element "#target-domain".');
    }
    targetDomain.textContent = "";

    const env = new Env({ context: "process" });
    const params = Env.getParamsFromUrl();
    await env.populate(params);
    new GitLogger(env.gitInfo).logVersion();

    if (env.debug) {
      env.logger.showLog();
    }

    let redirectUrl: string;

    const response = this.getRedirectResponse(env);

    if (response.status === "found") {
      redirectUrl = response.redirectUrl as string;
    } else {
      redirectUrl = this.getRedirectUrlToHome(env, response);
    }

    targetDomain.textContent = typeof response.redirectUrl === "string" ? response.redirectUrl : "";

    env.logger.info("Redirect to:   " + redirectUrl);

    if (env.debug) {
      return;
    }

    this.redirectTo(redirectUrl, response.status === "found");
  }

  /**
   * Given the environment, get a response object, incl. redirect URL.
   *
   * @param {object} env        - The environment.
   *
   * @return {object} response  - Contains redirect URL, status.
   */
  static getRedirectResponse(env: EnvLike): RedirectResponse {
    if (env.reload && !env.query) {
      return { status: "reloaded" };
    }

    if (!env.query) {
      return { status: "not_found", redirectUrl: false };
    }

    const shortcut = ShortcutFinder.findShortcut(env);

    if (!shortcut) {
      return { status: "not_found" };
    }

    if (shortcut.deprecated) {
      return {
        status: "deprecated",
        alternative: this.getAlternative(shortcut, env),
      };
    }

    if (shortcut.removed) {
      return {
        status: "removed",
        key: shortcut.key,
      };
    }

    if (!shortcut.reachable) {
      return {
        status: "not_reachable",
        namespace: shortcut.namespace,
      };
    }

    let redirectUrl = shortcut.url || "";

    env.logger.info("Used template: " + redirectUrl);

    redirectUrl = UrlProcessor.replaceVariables(redirectUrl, {
      language: env.language,
      country: env.country,
    });
    redirectUrl = UrlProcessor.replaceArguments(redirectUrl, env.args, env);

    if (!this.isSafeRedirectUrl(redirectUrl)) {
      return {
        status: "suspicious",
        redirectUrl,
      };
    }

    return {
      status: "found",
      redirectUrl,
    };
  }

  static getAlternative(shortcut: Shortcut, env: Pick<EnvLike, "args">): string {
    let alternative = shortcut.deprecated.alternative.query;
    for (const i in env.args) {
      alternative = alternative.replace("<" + (parseInt(i) + 1) + ">", env.args[i]);
    }
    return alternative;
  }

  static isSafeRedirectUrl(redirectUrl: string): boolean {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(redirectUrl);
    } catch {
      return false;
    }
    return ["http:", "https:", "mailto:"].includes(parsedUrl.protocol);
  }

  /**
   * Navigate to the given URL.
   *
   * When the app runs as an installed standalone PWA and the target is an
   * external shortcut result (not an internal redirect back to the home
   * page), try to hand the navigation off to the platform outside the
   * PWA's own window, so it opens in a normal browser tab/app instead of
   * staying inside the PWA's standalone chrome.
   *
   * @param {string} redirectUrl       - The URL to navigate to.
   * @param {boolean} isExternalTarget - Whether this is an external
   *                                     shortcut result, as opposed to an
   *                                     internal redirect back home.
   * @param {function} navigate        - How to perform the actual browser
   *                                     navigation when no PWA escape is
   *                                     needed or possible. Defaults to
   *                                     `window.location.replace`.
   */
  static redirectTo(
    redirectUrl: string,
    isExternalTarget: boolean,
    navigate: (url: string) => void = (url) => window.location.replace(url),
  ) {
    if (isExternalTarget && Env.isRunningStandalone()) {
      this.openExternally(redirectUrl, navigate);
      return;
    }
    navigate(redirectUrl);
  }

  /**
   * Detect the mobile platform from the user agent, to pick the
   * appropriate way of escaping the PWA's standalone window.
   *
   * @return {string} "android", "ios", or "other".
   */
  static getPlatform(): "android" | "ios" | "other" {
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
    if (/android/i.test(userAgent)) {
      return "android";
    }
    if (/iphone|ipad|ipod/i.test(userAgent)) {
      return "ios";
    }
    return "other";
  }

  /**
   * Try to navigate outside the PWA's own standalone window.
   *
   * @param {string} redirectUrl - The URL to open externally.
   * @param {function} navigate  - Fallback navigation, used when no
   *                               platform-specific escape applies.
   */
  static openExternally(redirectUrl: string, navigate: (url: string) => void) {
    const platform = this.getPlatform();

    if (platform === "android") {
      const intentUrl = this.buildAndroidIntentUrl(redirectUrl);
      if (intentUrl) {
        this.clickLink(intentUrl);
        return;
      }
    }

    if (platform === "ios") {
      const iosUrl = this.getIosExternalUrl(redirectUrl);
      if (iosUrl) {
        navigate(iosUrl);
        return;
      }
    }

    navigate(redirectUrl);
  }

  /**
   * Build an Android `intent://` URL that asks Android to resolve the
   * navigation outside of this PWA's own WebAPK, falling back to the
   * original URL if no app claims it.
   *
   * @param {string} redirectUrl - The http(s) URL to wrap.
   * @return {string|null} The intent URL, or null if not applicable.
   */
  static buildAndroidIntentUrl(redirectUrl: string): string | null {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(redirectUrl);
    } catch {
      return null;
    }
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return null;
    }
    const scheme = parsedUrl.protocol.slice(0, -1);
    const withoutScheme = redirectUrl.slice(parsedUrl.protocol.length + 2);
    return (
      `intent://${withoutScheme}#Intent;` +
      `scheme=${scheme};` +
      "action=android.intent.action.VIEW;" +
      "category=android.intent.category.BROWSABLE;" +
      "launchFlags=0x10000000;" +
      `S.browser_fallback_url=${encodeURIComponent(redirectUrl)};` +
      "end"
    );
  }

  /**
   * Build an `x-safari-https://` URL to route iOS navigation to Safari
   * instead of keeping it inside the PWA's own window.
   *
   * @param {string} redirectUrl - The https URL to wrap.
   * @return {string|null} The Safari URL, or null if not applicable.
   */
  static getIosExternalUrl(redirectUrl: string): string | null {
    if (!redirectUrl.startsWith("https://")) {
      return null;
    }
    return "x-safari-" + redirectUrl;
  }

  /**
   * Trigger navigation via a synthetic anchor click rather than
   * `location`, since some platforms only treat link clicks as eligible
   * to escape an installed PWA's standalone window.
   *
   * @param {string} url - The URL to "click".
   */
  static clickLink(url: string) {
    if (typeof document === "undefined") {
      return;
    }
    const link = document.createElement("a");
    link.href = url;
    link.rel = "noopener";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  /**
   * Redirect in case a shortcut was not found.
   *
   * @param {string} status       - The status of the call.
   *
   * @return {string} redirectUrl - Redirect URL to the homepage, with parameters.
   */
  static getRedirectUrlToHome(env: Pick<Env, "buildUrlParamStr">, response: RedirectResponse): string {
    const params = Env.getParamsFromUrl();
    delete params.query;
    for (const property of ["alternative", "key", "namespace", "status"]) {
      if (response[property]) {
        params[property] = response[property];
      }
    }
    const paramStr = env.buildUrlParamStr(params);
    const redirectUrl = "../index.html#" + paramStr;
    return redirectUrl;
  }
}
