/** @module HandleCall */

import LoadScripts from "./loadScripts.js";
import Helper from "./helper.js";
import ParseQuery from "./parseQuery.js";
import Find from "./findShortcut.js";
import ProcessUrl from "./processUrl.js";
import FindShortcut from "./findShortcut.js";

/** Handle a call. */

export default class HandleCall {
  /**
   * Set the environment.
   *
   * @param {object} env        - The environment.
   */
  constructor(env) {
    this.env = env;
  }

  redirectNotFound(env) {
    const params = Helper.getParams();
    params.status = "not_found";
    const paramStr = Helper.jqueryParam(params);
    const redirectUrl = "../index.html#" + paramStr;
    return redirectUrl;
  }

  /**
   * Rewrite browser history to make Back button work properly.
   */
  rewriteBrowserHistory() {
    const currentUrlWithoutProcess = window.location.href.replace('process\/', '');
    history.replaceState({}, "trovu.net", currentUrlWithoutProcess);
  }

  /**
   * Given this.env, get the redirect URL.
   *
   * @return {string} redirectUrl - The URL to redirect to.
   */
  async getRedirectUrl() {
    if (!this.env.query) {
      return;
    }

    Object.assign(this.env, ParseQuery.parse(this.env.query));

    // Add extraNamespace if parsed in query.
    if (this.env.extraNamespaceName) {
      this.env.extraNamespace = this.env.addFetchUrlTemplateToNamespace(this.env.extraNamespaceName);
      this.env.namespaces.push(this.env.extraNamespace);
    }

    const shortcuts = await FindShortcut.collectShortcuts(this.env);
    let redirectUrl = FindShortcut.pickShortcut(shortcuts, this.env.namespaces);

    if (!redirectUrl) return;

    if (this.env.debug) Helper.log("");
    if (this.env.debug) Helper.log("Used template: " + redirectUrl);

    redirectUrl = await ProcessUrl.replaceVariables(redirectUrl, { language: this.env.language, country: this.env.country });
    redirectUrl = await ProcessUrl.replaceArguments(redirectUrl, this.env.args, this.env);

    return redirectUrl;
  }
}