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

    this.redirect(redirectUrl);
  }

  /**
   * Redirect to the target URL.
   *
   * When running as an installed standalone PWA on Android, external http(s)
   * targets are opened via an Android `intent://` URI so that they leave the
   * PWA's own window and are handled by the device's default browser or the
   * app registered for that domain (see trovu/trovu#329). In every other
   * case we keep the historical behaviour of navigating the current window.
   *
   * @param {string} redirectUrl - The URL to redirect to.
   */
  static redirect(redirectUrl: string): void {
    if (this.isStandalonePwa() && this.getPlatform() === "android") {
      const intentUrl = this.buildAndroidIntentUrl(redirectUrl);
      if (intentUrl) {
        this.clickLink(intentUrl);
        return;
      }
    }
    window.location.replace(redirectUrl);
  }

  /**
   * Detect whether the app runs as an installed standalone PWA.
   *
   * @return {boolean} true when running in standalone (installed) mode.
   */
  static isStandalonePwa(): boolean {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  }

  /**
   * Detect the current platform from the user agent.
   *
   * @return {"android"|"ios"|"other"} The detected platform.
   */
  static getPlatform(): "android" | "ios" | "other" {
    const ua = window.navigator.userAgent;
    if (/android/i.test(ua)) {
      return "android";
    }
    if (/iphone|ipad|ipod/i.test(ua)) {
      return "ios";
    }
    return "other";
  }

  /**
   * Build an Android `intent://` URI for an http(s) URL so the system opens it
   * outside the PWA (default browser or the app registered for the domain).
   *
   * @param {string} url - The target URL.
   *
   * @return {string|null} The intent URI, or null when not applicable.
   */
  static buildAndroidIntentUrl(url: string): string | null {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return null;
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }
    const scheme = parsed.protocol.slice(0, -1);
    const path = parsed.pathname === "" ? "/" : parsed.pathname;
    return (
      `intent://${parsed.host}${path}${parsed.search}#Intent;` +
      `scheme=${scheme};` +
      `S.browser_fallback_url=${encodeURIComponent(url)};end`
    );
  }

  /**
   * Trigger navigation to an arbitrary URI (e.g. an Android intent) by
   * creating, clicking and removing a temporary anchor.
   *
   * @param {string} href - The URI to open.
   */
  static clickLink(href: string): void {
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
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
