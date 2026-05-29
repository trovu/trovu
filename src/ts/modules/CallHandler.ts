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

    this.redirect(redirectUrl, env.isRunningStandalone(), true);
  }

  /**
   * Safely redirect external target URLs out of the PWA standalone wrapper.
   *
   * @param {string} redirectUrl  - The target URL.
   * @param {boolean} isStandalone - Whether the app is running in PWA standalone mode.
   * @param {boolean} replace     - Whether to use location.replace instead of location.href.
   */
  static redirect(redirectUrl: string, isStandalone: boolean, replace = false) {
    if (isStandalone && /Android/i.test(window.navigator.userAgent)) {
      try {
        const url = new URL(redirectUrl);
        if ((url.protocol === "http:" || url.protocol === "https:") && !url.hash) {
          const scheme = url.protocol.slice(0, -1);
          const path = `${url.host}${url.pathname}${url.search}`;
          // FLAG_ACTIVITY_NEW_TASK (0x10000000): forces Android to open this in
          // a new activity task instead of the current WebAPK task.
          // Without this flag, Chrome handles the intent in its own existing
          // task and opens a Chrome Custom Tab overlaid on the PWA instead of
          // a full browser window. FLAG_ACTIVITY_NEW_TASK breaks out of the
          // WebAPK task entirely, giving the user the full Chrome browser UI
          // with address bar and tab switcher visible.
          const intentUrl = `intent://${path}#Intent;scheme=${scheme};package=com.android.chrome;launchFlags=0x10000000;S.browser_fallback_url=${encodeURIComponent(
            redirectUrl,
          )};end;`;

          // Use window.location.href — NOT link.click().
          // Chrome ~83+ silently blocks programmatic link.click() on intent://
          // anchors because the synthetic MouseEvent has isTrusted=false.
          // window.location.href is evaluated against the live user-activation
          // state, which is still valid in the synchronous submit handler stack.
          window.location.href = intentUrl;

          // If the intent is silently blocked (page stays visible), fall back
          // to plain navigation after 1500 ms. New-task launches take longer
          // than in-task CCTs, so 500 ms was too tight.
          const fallbackTimer = setTimeout(() => {
            window.location.href = redirectUrl;
          }, 1500);
          document.addEventListener(
            "visibilitychange",
            () => {
              if (document.hidden) clearTimeout(fallbackTimer);
            },
            { once: true },
          );
          return;
        }
      } catch {
        // Fallback to standard redirect if URL parsing fails
      }
    }

    if (isStandalone) {
      // For iOS and other non-Android PWA standalone environments, use a blank window to escape PWA container.
      try {
        const externalRedirectWindow = window.open("", "_blank");
        if (externalRedirectWindow) {
          externalRedirectWindow.opener = null;
          externalRedirectWindow.location.href = redirectUrl;
          return;
        }
      } catch {
        // Fallback to standard redirect
      }
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
