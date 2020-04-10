import Load from "./load.js";
import Helper from "./helper.js";
import Parse from "./parse.js";
import Find from "./find.js";
import ProcessUrl from "./processUrl.js";

/** Handle a call. */

export default class Handle {
  /**
   * Set the environment.
   *
   * @param {object} env        - The environment.
   */
  constructor(env) {
    this.env = env;
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

    Object.assign(this.env, Parse.parse(this.env.query));

    // Add extraNamespace if parsed in query.
    if (this.env.extraNamespaceName) {
      this.env.extraNamespace = this.env.addFetchUrlTemplateToNamespace(this.env.extraNamespaceName);
      this.env.namespaces.push(this.env.extraNamespace);
    }

    const shortcuts = await Find.collectShortcuts(this.env);
    let redirectUrl = Find.pickShortcut(shortcuts, this.env.namespaces);

    if (!redirectUrl) return;

    if (this.env.debug) Helper.log("");
    if (this.env.debug) Helper.log("Used template: " + redirectUrl);

    redirectUrl = await ProcessUrl.replaceVariables(redirectUrl, { language: this.env.language, country: this.env.country });
    redirectUrl = await ProcessUrl.replaceArguments(redirectUrl, this.env.args, this.env);

    return redirectUrl;
  }
}