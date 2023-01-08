/** @module Env */

import jsyaml from 'js-yaml';
import Helper from './Helper.js';
import UrlProcessor from './UrlProcessor.js';

/** Set and remember the environment. */

export default class Env {
  /**
   * Set helper variables.
   */
  constructor() {
    this.configUrlTemplate =
      'https://raw.githubusercontent.com/{%github}/trovu-data-user/master/config.yml';
  }

  /**
   * Get the params from env.
   *
   * @return {object} - The built params.
   */
  getParams() {
    const params = {};

    // Put environment into hash.
    if (this.github) {
      params['github'] = this.github;
    } else {
      params['language'] = this.language;
      params['country'] = this.country;
    }
    if (this.debug) {
      params['debug'] = 1;
    }
    // Don't add defaultKeyword into params
    // when Github user is set.
    if (this.defaultKeyword && !this.github) {
      params['defaultKeyword'] = this.defaultKeyword;
    }
    if (this.status) {
      params['status'] = this.status;
    }
    if (this.query) {
      params['query'] = this.query;
    }
    if (this.alternative) {
      params['alternative'] = this.alternative;
    }

    return params;
  }

  /**
   * Get the parameters as string.
   */
  getParamStr() {
    const params = this.getParams();
    const paramStr = Helper.getUrlParamStr(params);
    return paramStr;
  }

  /**
   * Set the initial class environment vars either from params or from GET hash string.
   *
   * @param {array} params - List of parameters to be used in environment.
   */
  async populate(params) {
    if (!params) {
      params = Helper.getUrlParams();
    }

    // Check within query for special commands.
    if (params.query) {
      // Check for debug.
      if (params.query.match(/^debug:/)) {
        params.debug = true;
        params.query = params.query.replace(/^debug:/, '');
      }
      // Check for reload.
      if (params.query.match(/^reload:/) || params.query.match(/^reload$/)) {
        params.reload = true;
        params.query = params.query.replace(/^reload(:?)/, '');
      }
    }

    if (typeof params.github === 'string' && params.github !== '') {
      await this.setWithUserConfigFromGithub(params);
    }

    // Override all with params.
    Object.assign(this, params);

    await this.setDefaults();
    this.addFetchUrlToNamespaces();
    await this.getShortcuts(this.namespaces, this.reload, this.debug);
  }

  async getShortcuts(namespaces, reload, debug) {
    await this.fetchShortcuts(namespaces, reload, debug);
    this.addInfoToShortcuts(namespaces);
  }

  /**
   * Set the user configuration from their fork in their Github profile.
   *
   * @param {array} params - Here, 'github' and 'debug' will be used
   */
  async setWithUserConfigFromGithub(params) {
    const config = await this.getUserConfigFromGithub(params);
    if (config) {
      Object.assign(this, config);
    }
  }

  /**
   * Get the user configuration from their fork in their Github profile.
   *
   * @param {array} params - Here, 'github' and 'debug' will be used
   *
   * @return {(object|boolean)} config - The user's config object, or false if fetch failed.
   */
  async getUserConfigFromGithub(params) {
    const configUrl = this.configUrlTemplate.replace(
      '{%github}',
      params.github,
    );
    const configYml = await Helper.fetchAsync(
      configUrl,
      params.reload,
      params.debug,
    );
    if (configYml) {
      try {
        const config = jsyaml.load(configYml);
        return config;
      } catch (error) {
        Helper.log('Error parsing ' + configUrl + ':\n\n' + error.message);
        this.error = true;
        return false;
      }
    } else {
      Helper.log('Failed to read Github config from ' + configUrl);
      this.error = true;
      return false;
    }
  }

  // Param getters ====================================================

  /**
   * Get the default language and country from browser.
   *
   * @return {object} [language, country] - The default language and country.
   */
  async getDefaultLanguageAndCountry() {
    let { language, country } = this.getLanguageAndCountryFromBrowser();

    if (!country) {
      country = await this.getCountryFromIP();
    }

    // Set defaults.
    language = language || 'en';
    country = country || 'us';

    // Ensure lowercase.
    language = language.toLowerCase();
    country = country.toLowerCase();

    return { language, country };
  }

  /**
   * Get the default language and country from browser.
   *
   * @return {object} [language, country] - The default language and country.
   */
  getLanguageAndCountryFromBrowser() {
    const languageStr = this.getNavigatorLanguage();
    let language, country;
    if (languageStr) {
      [language, country] = languageStr.split('-');
    }
    return { language, country };
  }

  /**
   * Wrapper for navigator language, capsuled to enable unit testing.
   *
   * @return {string} navigatorLanguage - The browser's value of navigator.language.
   */
  getNavigatorLanguage() {
    const languageStr = navigator.language;
    return languageStr;
  }

  /**
   * Get the country from the IP address.
   *
   * @return {string} country - The country as ISO 3166‑1 alpha-2 code
   */
  async getCountryFromIP() {
    const ipInfoUrl = 'https://api.db-ip.com/v2/free/self';
    const ipInfoText = await Helper.fetchAsync(ipInfoUrl, false);
    const ipInfo = JSON.parse(ipInfoText);
    const country = ipInfo.countryCode;
    return country;
  }

  /**
   * Set default environment variables if they are still empty.
   */
  async setDefaults() {
    let language, country;

    if (typeof this.language != 'string' || typeof this.country != 'string') {
      ({ language, country } = await this.getDefaultLanguageAndCountry());
    }

    // Default language.
    if (typeof this.language != 'string') {
      this.language = language;
    }
    // Default country.
    if (typeof this.country != 'string') {
      this.country = country;
    }
    // Default namespaces.
    if (typeof this.namespaces != 'object') {
      this.namespaces = ['o', this.language, '.' + this.country];
    }
    // Default debug.
    if (typeof this.debug != 'boolean') {
      this.debug = Boolean(this.debug);
    }
  }

  /**
   * Start fetching shortcuts per namespace.
   *
   * @param {array} namespaces - The namespaces to fetch shortcuts for.
   * @param {boolean} reload   - Flag whether to call fetch() with reload. Otherwise, it will be called with 'force-cache'.
   *
   * @return {array} promises - The promises from the fetch() calls.
   */
  async startFetches(namespaces, reload) {
    const promises = [];
    namespaces.forEach((namespace, i, namespaces) => {
      if (!namespace.url) {
        return namespaces;
      }
      promises.push(
        fetch(namespace.url, { cache: reload ? 'reload' : 'force-cache' }),
      );
    });
    return promises;
  }

  /**
   * Add a fetch URL template to a namespace.
   *
   * @param {array} namespaces - The namespaces to fetch shortcuts for.
   * @param {boolean} reload   - Flag whether to call fetch() with reload. Otherwise, it will be called with 'force-cache'.
   * @param {boolean} debug    - Flag whether to print debug messages.
   *
   * @return {array} namespaces - The namespaces with their fetched shortcuts, in a new property namespace.shortcuts.
   */
  async fetchShortcuts(namespaces, reload, debug) {
    const promises = await this.startFetches(namespaces, reload);

    // Wait until all fetch calls are done.
    const responses = await Promise.all(promises);

    for (const i in namespaces) {
      if (!responses[i] || responses[i].status != 200) {
        if (debug)
          Helper.log(
            (reload ? 'reload ' : 'cache  ') + 'Fail:    ' + namespaces[i].url,
          );
        // Mark namespace for deletion.
        namespaces[i] = undefined;
        continue;
      }
      if (debug)
        Helper.log(
          (reload ? 'reload ' : 'cache  ') + 'Success: ' + responses[i].url,
        );
      if (!debug) {
        Helper.log('.', false);
      }
      const text = await responses[i].text();
      let shortcuts;
      try {
        shortcuts = jsyaml.load(text);
      } catch (error) {
        Helper.log(
          'Error parsing ' + namespaces[i].url + ':\n\n' + error.message,
        );
        this.error = true;
        namespaces[i] = undefined;
        continue;
      }
      // TODO: Put this outside of fetchShortcuts
      // as this is a separate logic.
      namespaces[i].shortcuts = this.normalizeShortcutsOfNamespace(
        shortcuts,
        namespaces[i].name,
      );
    }
    // Delete marked namespaces.
    namespaces = namespaces.filter(
      (namespace) => typeof namespace !== 'undefined',
    );
    // We only need to return here
    // for receiving in CallHandler.addExtraNamespace().
    return namespaces;
  }

  /**
   * To every namespace, add a fetch URL template.
   */
  addFetchUrlToNamespaces() {
    this.namespaces.forEach((namespace, i, namespaces) => {
      namespace = this.addFetchUrlToNamespace(namespace);
      namespaces[i] = namespace;
    });
  }

  /**
   * Add a fetch URL template to a namespace.
   *
   * @param {(string|Object)} namespace - The namespace to add the URL template to.
   *
   * @return {Object} namespace - The namespace with the added URL template.
   */
  addFetchUrlToNamespace(namespace) {
    // Site namespaces:
    if (typeof namespace == 'string' && namespace.length < 4) {
      namespace = this.addFetchUrlToSiteNamespace(namespace);
      return namespace;
    }
    // User namespace 1 – custom URL:
    if (namespace.url && namespace.name) {
      // Just add the type.
      namespace.type = 'user';
      return namespace;
    }
    // Now remains: User namespace 2 – Github:
    if (typeof namespace == 'string') {
      // Create an object.
      namespace = { github: namespace };
    }
    namespace = this.addFetchUrlToGithubNamespace(namespace);
    return namespace;
  }

  /**
   * Add a URL template to a namespace that refers to a namespace in trovu-data.
   *
   * @param {string} name - The namespace name.
   *
   * @return {Object} namespace - The namespace with the added URL template.
   */
  addFetchUrlToSiteNamespace(name) {
    const namespace = {
      name: name,
      type: 'site',
      url: 'https://data.trovu.net/data/shortcuts/' + name + '.yml',
    };
    return namespace;
  }

  /**
   * Add a URL template to a namespace that refers to a Github user repo.
   *
   * @param {string} name - The namespace name.
   *
   * @return {Object} namespace - The namespace with the added URL template.
   */
  addFetchUrlToGithubNamespace(namespace) {
    if (namespace.github == '.') {
      // Set to current user.
      namespace.github = this.github;
    }
    // Default name to Github name.
    if (!namespace.name) {
      namespace.name = namespace.github;
    }
    namespace.url =
      'https://raw.githubusercontent.com/' +
      namespace.github +
      '/trovu-data-user/master/shortcuts.yml';
    namespace.type = 'user';
    return namespace;
  }

  /**
   * Ensure shortcuts have the correct structure.
   *
   * @param {array} shortcuts      - The shortcuts to normalize.
   * @param {string} namespaceName - The namespace name to show in error message.
   *
   * @return {array} shortcuts - The normalized shortcuts.
   */
  normalizeShortcutsOfNamespace(shortcuts, namespaceName) {
    const incorrectKeys = [];
    for (const key in shortcuts) {
      if (!key.match(/\S+ \d/)) {
        incorrectKeys.push(key);
      }
      // Check for 'only URL' (string) shortcuts
      // and make an object of them.
      if (typeof shortcuts[key] === 'string') {
        const url = shortcuts[key];
        shortcuts[key] = {
          url: url,
        };
      }
    }
    // Handle include.
    for (const key in shortcuts) {
      const shortcut = shortcuts[key];
      if (shortcut.include) {
        const shortcutToInclude = shortcuts[shortcut.include.key];
        Object.assign(shortcut, shortcutToInclude);
        // TODO: Handle different namespace.
      }
    }
    if (incorrectKeys.length > 0) {
      Helper.log(
        "Incorrect keys found in namespace '" +
          namespaceName +
          "'. Keys must have the form 'KEYWORD ARGCOUNT', e.g.: 'foo 0'" +
          '\n\n' +
          incorrectKeys.join('\n'),
      );
      this.error = true;
    }
    return shortcuts;
  }

  /**
   * Enrich shortcuts with their own information: argument & namespace names, reachable.
   *
   * @param {object} namespaces - Current namespaces keyed by their name.
   */
  addInfoToShortcuts(namespaces) {
    // Remember found shortcuts
    // to know which ones are reachable.
    const foundShortcuts = {};

    // Iterate over namespaces in reverse order.
    // Slice to keep original.
    for (const namespace of namespaces.slice().reverse()) {
      const shortcuts = namespace.shortcuts;

      for (const key in shortcuts) {
        const shortcut = shortcuts[key];

        [shortcut.keyword, shortcut.argumentCount] = key.split(' ');
        shortcut.namespace = namespace.name;
        shortcut.arguments = UrlProcessor.getArgumentsFromString(
          shortcuts[key].url,
        );

        shortcut.title = shortcut.title || '';

        // If not yet present: reachable.
        // (Because we started with most precendent namespace.)
        if (!(key in foundShortcuts)) {
          shortcut.reachable = true;
        }
        // Others are unreachable
        // but can be reached with namespace forcing.
        else {
          shortcut.reachable = false;
        }

        shortcuts[key] = shortcut;
        foundShortcuts[key] = true;
      }
    }
  }
}
