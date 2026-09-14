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

    this.redirectTo(env, redirectUrl);
  }

  /**
   * Navigate to the given URL.
   *
   * Inside an installed standalone PWA, a plain `location.replace()` keeps
   * the navigation inside the PWA's own window/task instead of handing off
   * to the system browser or a matching native app (Maps, YouTube, etc.).
   * On Android and iOS we route around that; everywhere else (a normal
   * browser tab, the web extension, desktop PWAs) behaviour is unchanged.
   *
   * @param {object} env         - The environment.
   * @param {string} redirectUrl - The URL to navigate to.
   */
  static redirectTo(env: Pick<Env, "isRunningStandalone">, redirectUrl: string): void {
    if (!env.isRunningStandalone()) {
      this.locationReplace(redirectUrl);
      return;
    }

    const platform = this.getPlatform(window.navigator.userAgent);

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
        this.locationSetHref(iosUrl);
        return;
      }
    }

    this.locationReplace(redirectUrl);
  }

  /** Thin, spy-able wrappers around `window.location`, kept separate so
   * tests don't have to fight jsdom's non-configurable `location` object. */
  static locationReplace(url: string): void {
    window.location.replace(url);
  }

  static locationSetHref(url: string): void {
    window.location.href = url;
  }

  /**
   * Determine the mobile platform from a user agent string.
   */
  static getPlatform(userAgent: string): "android" | "ios" | "other" {
    if (/android/i.test(userAgent)) {
      return "android";
    }
    if (/iphone|ipad|ipod/i.test(userAgent)) {
      return "ios";
    }
    return "other";
  }

  /**
   * Build an Android `intent://` URL asking the OS to resolve the target in
   * a task separate from the installed PWA's own. `launchFlags=0x18080000`
   * combines `FLAG_ACTIVITY_NEW_TASK | FLAG_ACTIVITY_MULTIPLE_TASK |
   * FLAG_ACTIVITY_NEW_DOCUMENT`, asking for a genuinely separate task
   * rather than one merged into the PWA's own.
   *
   * No `package=` is set, so Android resolves it exactly as it would a
   * normal out-of-app link tap: a matching native app (Maps, YouTube, ...)
   * opens directly and fully, bypassing any browser entirely — confirmed
   * working. For a generic https target with no matching app, this lands
   * in a Chrome Custom Tab (address bar, no tab switcher) rather than a
   * full browser window; that appears to be Chrome's own enforced
   * behaviour for navigation leaving an installed web app's scope, not
   * something controllable via intent flags or package pinning — pinning
   * to `com.android.chrome` was tried and made no difference to that
   * outcome, while breaking the fix entirely for non-Chrome-default users,
   * so it's deliberately left unset here.
   *
   * `S.browser_fallback_url` keeps Chrome from dead-ending if no app can
   * handle the intent.
   *
   * Returns null for anything that isn't a plain http(s) URL.
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
    const scheme = parsedUrl.protocol.replace(":", "");
    const rest = redirectUrl.slice(scheme.length + 3); // Strip "http(s)://".
    const fallback = encodeURIComponent(redirectUrl);
    return (
      `intent://${rest}#Intent;` +
      `scheme=${scheme};` +
      `action=android.intent.action.VIEW;` +
      `category=android.intent.category.BROWSABLE;` +
      `launchFlags=0x18080000;` +
      `S.browser_fallback_url=${fallback};` +
      `end`
    );

  }

  /**
   * Convert an https URL into Safari's private `x-safari-https://` scheme,
   * which asks iOS to hand the navigation to Safari rather than keeping it
   * inside the installed PWA. Returns null for anything else (http, mailto,
   * ...), which falls back to the default `location.replace()`.
   */
  static getIosExternalUrl(redirectUrl: string): string | null {
    if (!redirectUrl.startsWith("https://")) {
      return null;
    }
    return "x-safari-" + redirectUrl;
  }

  /**
   * Navigate via a real anchor click rather than a scripted `location`
   * change. Android only hands `intent://` URLs to its intent resolver —
   * and thus lets them escape the PWA's own task — when they arrive through
   * actual link navigation, not `location.assign()`/`location.replace()`.
   */
  static clickLink(url: string): void {
    const link = document.createElement("a");
    link.href = url;
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
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