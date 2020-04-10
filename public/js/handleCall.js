/** @module HandleCall */

import Env from "./env.js";
import LoadScripts from "./loadScripts.js";
import Helper from "./helper.js";
import ParseQuery from "./parseQuery.js";
import ProcessUrl from "./processUrl.js";
import FindShortcut from "./findShortcut.js";

/** Handle a call. */

export default class HandleCall {

  /**
   * Redirect in case a shortcut was not found.
   *
   * @param {object} env        - The environment.
   *
   * @return {string} redirectUrl - Redirect URL to the homepage, with parameters.
   */
  static redirectNotFound(env) {
    const params = Helper.getParams();
    params.status = "not_found";
    const paramStr = Helper.jqueryParam(params);
    const redirectUrl = "../index.html#" + paramStr;
    return redirectUrl;
  }

  /**
   * Rewrite browser history to make Back button work properly.
   */
  static rewriteBrowserHistory() {
    const currentUrlWithoutProcess = window.location.href.replace('process\/', '');
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
    if (!env.query) {
      return;
    }

    Object.assign(env, ParseQuery.parse(env.query));

    // Add extraNamespace if parsed in query.
    if (env.extraNamespaceName) {
      env.extraNamespace = env.addFetchUrlTemplateToNamespace(env.extraNamespaceName);
      env.namespaces.push(env.extraNamespace);
    }

    const shortcuts = await FindShortcut.collectShortcuts(env);
    let redirectUrl = FindShortcut.pickShortcut(shortcuts, env.namespaces);

    if (!redirectUrl) return;

    if (env.debug) Helper.log("");
    if (env.debug) Helper.log("Used template: " + redirectUrl);

    redirectUrl = await ProcessUrl.replaceVariables(redirectUrl, { language: env.language, country: env.country });
    redirectUrl = await ProcessUrl.replaceArguments(redirectUrl, env.args, env);

    return redirectUrl;
  }

  /**
   * The 'main' function of this class.
   */
  static async handleCall() {

    const env = new Env();
    await env.populate();
  
    let redirectUrl = await this.getRedirectUrl(env);
  
    if (!redirectUrl) {
      redirectUrl = this.redirectNotFound(env);
    }
  
    if (env.debug) {
      Helper.log("Redirect to:   " + redirectUrl);
      return;
    }
  
    this.rewriteBrowserHistory();
  
    window.location.href = redirectUrl;
  };

}