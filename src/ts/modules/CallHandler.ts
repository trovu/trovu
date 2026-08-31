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

    this.openTargetUrl(redirectUrl, env);
  }

  /**
   * Leave a standalone PWA so the OS can open the default browser or a native app.
   * Android Chrome keeps https navigations inside the PWA; an intent:// VIEW does not.
   * In-app fallbacks (home, errors) stay inside the PWA.
   */
  static openTargetUrl(redirectUrl: string, env: { isRunningStandalone?: () => boolean }) {
    const standalone = typeof env.isRunningStandalone === "function" && env.isRunningStandalone();
    const staysInPwa =
      redirectUrl.startsWith("../") ||
      redirectUrl.startsWith("index.html") ||
      redirectUrl.startsWith("./") ||
      redirectUrl.startsWith("#");

    if (!standalone || staysInPwa) {
      window.location.replace(redirectUrl);
      return;
    }

    if (redirectUrl.startsWith("mailto:")) {
      window.location.href = redirectUrl;
      return;
    }

    if (/Android/i.test(navigator.userAgent || "")) {
      window.location.href = this.toAndroidIntentUrl(redirectUrl);
      return;
    }

    const opened = window.open(redirectUrl, "_blank", "noopener,noreferrer");
    if (!opened) {
      window.location.href = redirectUrl;
    }
  }

  /** Android Intent URL that asks the OS to VIEW this http(s) address outside the PWA. */
  static toAndroidIntentUrl(url: string): string {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return url;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return url;
    }
    const scheme = parsed.protocol.replace(":", "");
    const path = `${parsed.host}${parsed.pathname}${parsed.search}`;
    const fallback = encodeURIComponent(url);
    return `intent://${path}#Intent;scheme=${scheme};action=android.intent.action.VIEW;S.browser_fallback_url=${fallback};end`;
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
