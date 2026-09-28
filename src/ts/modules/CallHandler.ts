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
   * page), hand the navigation off to the platform outside the PWA's
   * own window, so it opens in a normal browser tab or registered app
   * instead of staying inside the PWA container.
   *
   * @param {string} redirectUrl       - The URL to navigate to.
   * @param {boolean} isExternalTarget - Whether this is an external
   *                                     shortcut result, as opposed to an
   *                                     internal redirect back home.
   * @param {function} navigate        - Fallback navigation callback.
   *                                     Defaults to window.location.replace.
   */
  static redirectTo(
    redirectUrl: string,
    isExternalTarget: boolean,
    navigate: (url: string) => void = (url) => window.location.replace(url),
  ): void {
    if (isExternalTarget && Env.isRunningStandalone()) {
      this.openExternally(redirectUrl, navigate);
      return;
    }
    navigate(redirectUrl);
  }

  /**
   * Detect the platform from the user agent.
   *
   * @param {string} userAgent - The user agent string.
   * @return {string} "android", "ios", or "other".
   */
  static getPlatform(userAgent: string = typeof navigator !== "undefined" ? navigator.userAgent : ""): "android" | "ios" | "other" {
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
   * @param {function} navigate  - Fallback navigation.
   */
  static openExternally(redirectUrl: string, navigate: (url: string) => void): void {
    const platform = this.getPlatform();

    if (platform === "android") {
      const intentUrl = this.buildAndroidIntentUrl(redirectUrl);
      if (intentUrl) {
        this.clickLink(intentUrl, "_blank");
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

    const popup = typeof window.open === "function" ? window.open(redirectUrl, "_blank", "noopener,noreferrer") : null;
    if (!popup) {
      this.clickLink(redirectUrl, "_blank");
    }
  }

  /**
   * Build an Android intent:// URL to ask Android to resolve the navigation
   * in a new document/task, routing to the default browser or matching app.
   *
   * @param {string} redirectUrl - The URL to wrap.
   * @return {string|null} The intent URL, or null if not an http(s) URL.
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
   * Build an x-safari- URL to route iOS navigation to Safari
   * instead of keeping it inside the PWA's standalone window.
   *
   * @param {string} redirectUrl - The URL to wrap.
   * @return {string|null} The Safari URL, or null if not applicable.
   */
  static getIosExternalUrl(redirectUrl: string): string | null {
    if (redirectUrl.startsWith("https://")) {
      return "x-safari-https://" + redirectUrl.slice("https://".length);
    }
    if (redirectUrl.startsWith("http://")) {
      return "x-safari-http://" + redirectUrl.slice("http://".length);
    }
    return null;
  }

  /**
   * Trigger navigation via a synthetic anchor click.
   *
   * @param {string} url    - The URL to navigate to.
   * @param {string} target - The target attribute value (e.g. "_blank").
   */
  static clickLink(url: string, target?: string): void {
    if (typeof document === "undefined") {
      return;
    }
    const link = document.createElement("a");
    link.href = url;
    if (target) {
      link.target = target;
    }
    link.rel = "noopener noreferrer";
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
