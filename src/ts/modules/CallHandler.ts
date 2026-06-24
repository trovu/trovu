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

    this.performRedirect(redirectUrl, env, true);
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

  static isAndroid(): boolean {
    return /Android/i.test(window.navigator.userAgent);
  }

  static isExternalHttpUrl(redirectUrl: string): boolean {
    try {
      return ["http:", "https:"].includes(new URL(redirectUrl).protocol);
    } catch {
      return false;
    }
  }

  static shouldOpenInExternalBrowser(
    redirectUrl: string,
    env: Pick<Env, "isRunningStandalone">,
  ): boolean {
    if (!env.isRunningStandalone()) {
      return false;
    }
    if (redirectUrl.startsWith("../") || redirectUrl.startsWith("/")) {
      return false;
    }
    return this.isExternalHttpUrl(redirectUrl);
  }

  static buildAndroidIntentUrl(redirectUrl: string): string {
    const url = new URL(redirectUrl);
    const path = `${url.host}${url.pathname}${url.search}`;
    const scheme = url.protocol.replace(":", "");
    return `intent://${path}#Intent;scheme=${scheme};S.browser_fallback_url=${encodeURIComponent(redirectUrl)};end`;
  }

  static performRedirect(
    redirectUrl: string,
    env: Pick<Env, "isRunningStandalone">,
    replace = false,
  ): void {
    if (!this.shouldOpenInExternalBrowser(redirectUrl, env)) {
      if (replace) {
        window.location.replace(redirectUrl);
      } else {
        window.location.href = redirectUrl;
      }
      return;
    }
    if (this.isAndroid()) {
      window.location.href = this.buildAndroidIntentUrl(redirectUrl);
      return;
    }
    // Non-Android standalone: rely on handle_links:not-preferred in the manifest.
    if (replace) {
      window.location.replace(redirectUrl);
    } else {
      window.location.href = redirectUrl;
    }
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
