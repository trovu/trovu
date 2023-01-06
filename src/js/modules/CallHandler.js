/** @module CallHandler */

import Env from './Env.js';
import ShortcutFinder from './ShortcutFinder.js';
import Helper from './Helper.js';
import QueryParser from './QueryParser.js';
import UrlProcessor from './UrlProcessor.js';

/** Handle a call. */

export default class CallHandler {
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
    const redirectUrl = '../index.html#' + paramStr;
    return redirectUrl;
  }

  /**
   * Rewrite browser history to make Back button work properly.
   */
  static rewriteBrowserHistory() {
    const currentUrlWithoutProcess = window.location.href.replace(
      'process/',
      '',
    );
    history.replaceState({}, 'trovu.net', currentUrlWithoutProcess);
  }

  /**
   * Given the environment, get the redirect URL.
   *
   * @param {object} env        - The environment.
   *
   * @return {string} redirectUrl - The URL to redirect to.
   */
  static async getRedirectUrl(env) {
    const response = {};

    if (env.reload && !env.query) {
      response.status = 'reloaded';
      return response;
    }

    if (!env.query) {
      response.status = 'not_found';
      response.redirectUrl = false;
      return response;
    }

    Object.assign(env, QueryParser.parse(env.query));

    // Add extraNamespace if parsed in query.
    if (env.extraNamespaceName) {
      env.extraNamespace = env.addFetchUrlToNamespace(env.extraNamespaceName);
      [env.extraNamespace] = await env.fetchShortcuts(
        [env.extraNamespace],
        env.reload,
        env.debug,
      );
      if (env.extraNamespace) {
        env.namespaces.push(env.extraNamespace);
      }
    }

    const shortcuts = await ShortcutFinder.collectShortcuts(env);
    const shortcut = ShortcutFinder.pickShortcut(
      shortcuts,
      env.namespaces,
    );

    response.redirectUrl = shortcut.url;

    if (!response.redirectUrl) {
      response.status = 'not_found';
      return response;
    }

    response.status = 'found';

    if (env.debug) Helper.log('');
    if (env.debug) Helper.log('Used template: ' + response.redirectUrl);

    response.redirectUrl = await UrlProcessor.replaceVariables(
      response.redirectUrl,
      {
        language: env.language,
        country: env.country,
      },
    );
    response.redirectUrl = await UrlProcessor.replaceArguments(
      response.redirectUrl,
      env.args,
      env,
    );

    return response;
  }

  /**
   * The 'main' function of this class.
   */
  static async handleCall() {
    const env = new Env();
    await env.populate();

    const response = await this.getRedirectUrl(env);

    if (response.status !== 'found') {
      response.redirectUrl = this.redirectHome(response.status);
    }

    if (env.debug) {
      Helper.log('Redirect to:   ' + response.redirectUrl);
      return;
    }

    this.rewriteBrowserHistory();

    if (!env.error) {
      window.location.href = response.redirectUrl;
    }
  }
}
