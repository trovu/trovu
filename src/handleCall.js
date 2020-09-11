/** @module HandleCall */

import Env from "./env.js";
import FindShortcut from "./findShortcut.js";
import Helper from "./helper.js";
import ParseQuery from "./parseQuery.js";
import ProcessUrl from "./processUrl.js";

/** Handle a call. */

export default class HandleCall {
  /**
   * Redirect in case a shortcut was not found.
   *
   * @param {string} status       - The status of the call.
   *
   * @return {string} redirectUrl - Redirect URL to the homepage, with parameters.
   */
  static redirectHome(status) {
    const params = Helper.getUrlParams();
    params.status = status;
    const paramStr = Helper.getUrlParamStr(params);
    const redirectUrl = "../index.html#" + paramStr;
    return redirectUrl;
  }

  /**
   * Rewrite browser history to make Back button work properly.
   */
  static rewriteBrowserHistory() {
    const currentUrlWithoutProcess = window.location.href.replace(
      "process/",
      ""
    );
    history.replaceState({}, "trovu.net", currentUrlWithoutProcess);
  }

  /**
   * Given the environment, get the redirect URL.
   *
   * @param {object} env        - The environment.
   *
   * @return {string} redirectUrl - The URL to redirect to.
   */
  static async getRedirectUrl(env) {
    let redirectUrl;
    let status;

    if (!env.query) {
      return;
    }

    Object.assign(env, ParseQuery.parse(env.query));

    if (env.reload) {
      await env.fetchShortcuts(env.namespaces, true, env.debug);
    }
    if (env.keyword === "") {
      status = "reloaded";
      return [status, redirectUrl];
    }

    // Add extraNamespace if parsed in query.
    if (env.extraNamespaceName) {
      env.extraNamespace = env.addFetchUrlToNamespace(env.extraNamespaceName);
      [env.extraNamespace] = await env.fetchShortcuts(
        [env.extraNamespace],
        env.reload,
        env.debug
      );
      if (env.extraNamespace) {
        env.namespaces.push(env.extraNamespace);
      }
    }

    const shortcuts = await FindShortcut.collectShortcuts(env);
    redirectUrl = FindShortcut.pickShortcut(shortcuts, env.namespaces);

    if (!redirectUrl) {
      status = "not_found";
      return [status, redirectUrl];
    }

    status = "found";

    if (env.debug) Helper.log("");
    if (env.debug) Helper.log("Used template: " + redirectUrl);

    redirectUrl = await ProcessUrl.replaceVariables(redirectUrl, {
      language: env.language,
      country: env.country,
    });
    redirectUrl = await ProcessUrl.replaceArguments(redirectUrl, env.args, env);

    return [status, redirectUrl];
  }

  /**
   * The 'main' function of this class.
   */
  static async handleCall() {
    const env = new Env();
    await env.populate();

    let [status, redirectUrl] = await this.getRedirectUrl(env);

    if (status !== "found") {
      redirectUrl = this.redirectHome(status);
    }

    if (env.debug) {
      Helper.log("Redirect to:   " + redirectUrl);
      return;
    }

    this.rewriteBrowserHistory();

    window.location.href = redirectUrl;
  }
}
