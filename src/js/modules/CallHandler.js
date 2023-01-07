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
  static redirectHome(response) {
    const params = Helper.getUrlParams();
    switch (response.status) {
      case 'deprecated':
        params.alternative = response.alternative;
        break;
    }
    params.status = response.status;
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
   * Given the environment, get a response object, incl. redirect URL.
   *
   * @param {object} env        - The environment.
   *
   * @return {object} response  - Contains redirect URL, status.
   */
  static async getRedirectResponse(env) {
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
      await CallHandler.addExtraNamespace(env);
    }

    const shortcuts = await ShortcutFinder.collectShortcuts(env);
    const shortcut = ShortcutFinder.pickShortcut(shortcuts, env.namespaces);

    if (!shortcut) {
      response.status = 'not_found';
      return response;
    }

    if (!shortcut.deprecated) {
      response.redirectUrl = shortcut.url;
    } else {
      response.status = 'deprecated';
      response.alternative = shortcut.deprecated.alternative.query;
      for (const i in env.args) {
        response.alternative = response.alternative.replace(
          '{%' + (parseInt(i) + 1) + '}',
          env.args[i],
        );
      }
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
   * Adding extra namespace if such one was called in the query.
   */
  static async addExtraNamespace(env) {
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

  /**
   * The 'main' function of this class.
   */
  static async handleCall() {
    const env = new Env();
    await env.populate();

    let redirectUrl;

    const response = await this.getRedirectResponse(env);

    if (response.status === 'found') {
      redirectUrl = response.redirectUrl;
    } else {
      redirectUrl = this.redirectHome(response);
    }

    if (env.debug) {
      Helper.log('Redirect to:   ' + redirectUrl);
      return;
    }

    this.rewriteBrowserHistory();

    if (!env.error) {
      window.location.href = redirectUrl;
    }
  }
}
