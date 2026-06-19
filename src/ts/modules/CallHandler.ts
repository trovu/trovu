/** @module CallHandler */
import Env from "./Env";
import GitLogger from "./GitLogger";
import ShortcutFinder from "./ShortcutFinder";
import UrlProcessor from "./UrlProcessor";

type RedirectResponse =
  | { status: "found"; redirectUrl: string }
  | { status: "not_found"; redirectUrl?: false }
  | { status: "reloaded" }
  | { status: "deprecated"; alternative: string }
  | { status: "removed"; key: string }
  | { status: "not_reachable"; namespace: string }
  | { status: "suspicious"; redirectUrl: string };
/** Handle a call. */
export default class CallHandler {
  /**
   * Main entry
   */
  static async handleCall() {
    const targetDomain =
document.querySelector("#target-domain") as HTMLElement;
    if (!targetDomain) {
      throw new Error('Missing element "#target-domain".');
    }

    targetDomain.textContent = "";

    const env = new Env({ context: "process" });
const params: AnyObject = Env.getParamsFromUrl();
    await env.populate(params);

    new GitLogger(env.gitInfo).logVersion();

    if (env.debug) {
      env.logger.showLog();
    }

    const response = this.getRedirectResponse(env);

    const found = response.status === "found";

    const redirectUrl =
      found
        ? (response.redirectUrl as string)
        : this.getRedirectUrlToHome(env, response);

    targetDomain.textContent =
  "redirectUrl" in response &&
  typeof response.redirectUrl === "string"
    ? response.redirectUrl
    : "";

    env.logger.info("Redirect to: " + redirectUrl);

    if (env.debug) return;

   const navigationUrl = this.getNavigationUrl(
  redirectUrl,
  found,
);

const a = document.createElement("a");
a.href = navigationUrl;
a.rel = "noopener noreferrer";
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
  }

static getRedirectResponse(env: AnyObject): RedirectResponse  {
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

    let url = shortcut.url || "";

    env.logger.info("Used template: " + url);

    url = UrlProcessor.replaceVariables(url, {
      language: env.language,
      country: env.country,
    });

    url = UrlProcessor.replaceArguments(url, env.args, env);

    if (!this.isSafeRedirectUrl(url)) {
      return { status: "suspicious", redirectUrl: url };
    }

    return {
      status: "found",
      redirectUrl: url,
    };
  }

  static getAlternative(shortcut: AnyObject, env: AnyObject) {
    let alt = shortcut.deprecated.alternative.query;

    for (const i in env.args) {
      alt = alt.replace(
        `<${parseInt(i) + 1}>`,
        env.args[i],
      );
    }

    return alt;
  }

  static isSafeRedirectUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ["http:", "https:", "mailto:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  static getRedirectUrlToHome(
    env: Env,
    response: RedirectResponse,
  ): string {
   const params: AnyObject = Env.getParamsFromUrl();
delete params.query;

    for (const p of [
      "alternative",
      "key",
      "namespace",
      "status",
    ]) {
      if ((response as any)[p]) {
        (params as any)[p] = (response as any)[p];
      }
    }

    return "../index.html#" + env.buildUrlParamStr(params);
  }

  static getNavigationUrl(url: string, found: boolean): string {
    if (!found) return url;

    const isStandalone =
      typeof window !== "undefined" &&
      window.matchMedia?.("(display-mode: standalone)").matches;

    const isAndroid =
      typeof navigator !== "undefined" &&
      /Android/i.test(navigator.userAgent);

    if (isStandalone && isAndroid) {
      const intent = this.toIntent(url);
      return intent || url;
    }

    return url;
  }

  static toIntent(url: string): string | false {
    try {
      const parsed = new URL(url);

      if (!["http:", "https:"].includes(parsed.protocol)) {
        return false;
      }

      const scheme = parsed.protocol.replace(":", "");
      const path =
        parsed.host +
        parsed.pathname +
        parsed.search;

      const fallback = encodeURIComponent(url);

      return `intent://${path}#Intent;scheme=${scheme};S.browser_fallback_url=${fallback};end`;
    } catch {
      return false;
    }
  }
}