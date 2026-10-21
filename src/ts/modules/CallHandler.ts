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

    this.navigateToTarget(redirectUrl, env, true);
  }

  /**
   * Build an Android intent:// URL so external http(s) targets are handed off
   * to the system browser / app handler when launched from an installed PWA.
   *
   * @param {string} redirectUrl - Target http(s) URL.
   * @return {string} - Android intent:// URL or the original URL if not http(s).
   */
  static buildAndroidIntentUrl(redirectUrl: string): string {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(redirectUrl);
    } catch {
      return redirectUrl;
    }
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return redirectUrl;
    }
    const scheme = parsedUrl.protocol.slice(0, -1);
    const pathWithQueryAndHash = `${parsedUrl.host}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
    return (
      `intent://${pathWithQueryAndHash}#Intent;scheme=${scheme};` +
      `action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;` +
      `S.browser_fallback_url=${encodeURIComponent(redirectUrl)};end`
    );
  }

  /**
   * Check whether a redirect URL is an external http(s) target.
   *
   * @param {string} redirectUrl - Candidate redirect URL.
   * @return {boolean}
   */
  static isExternalHttpUrl(redirectUrl: string): boolean {
    if (redirectUrl.startsWith("../") || redirectUrl.startsWith("/") || redirectUrl.startsWith("#")) {
      return false;
    }
    try {
      const parsedUrl = new URL(redirectUrl);
      return ["http:", "https:"].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Navigate to a resolved redirect URL, opening external http(s) targets
   * outside the standalone PWA container when running as an installed PWA.
   *
   * @param {string} redirectUrl - Destination URL.
   * @param {object} env         - Environment providing isRunningStandalone().
   * @param {boolean} replace    - Use location.replace for in-tab navigation.
   */
  static navigateToTarget(
    redirectUrl: string,
    env: Pick<Env, "isRunningStandalone">,
    replace = false,
  ): void {
    const isStandalonePwa =
      Boolean(env?.isRunningStandalone?.()) ||
      (typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        (window.matchMedia("(display-mode: standalone)").matches ||
          window.matchMedia("(display-mode: minimal-ui)").matches)) ||
      (typeof window !== "undefined" &&
        (window.navigator as Navigator & { standalone?: boolean })?.standalone === true);

    if (isStandalonePwa && this.isExternalHttpUrl(redirectUrl)) {
      const userAgent = typeof window !== "undefined" ? window.navigator.userAgent || "" : "";
      const targetHref = /Android/i.test(userAgent)
        ? this.buildAndroidIntentUrl(redirectUrl)
        : redirectUrl;

      const extLink = document.createElement("a");
      extLink.href = targetHref;
      extLink.target = "_blank";
      extLink.rel = "noopener noreferrer external";
      document.body.appendChild(extLink);
      extLink.click();
      extLink.remove();
      return;
    }

    if (replace) {
      window.location.replace(redirectUrl);
    } else {
      window.location.href = redirectUrl;
    }
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
