/** @module Env */

import jsyaml from 'js-yaml';
import Helper from './Helper.js';
import UrlProcessor from './UrlProcessor.js';
import QueryParser from './QueryParser.js';

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
    if (this.key) {
      params['key'] = this.key;
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

    if (typeof params.github === 'string' && params.github !== '') {
      await this.setWithUserConfigFromGithub(params);
    }

    Object.assign(this, params);
    Object.assign(this, QueryParser.parse(this.query));
    await this.setDefaults();

    if (this.extraNamespaceName) {
      this.namespaces.push(this.extraNamespaceName);
    }

    this.namespaceInfos = await this.getNamespaceInfos2(
      this.namespaces,
      this.reload,
      this.debug,
    );

    this.namespaces = await this.getNamespaceInfos(
      this.namespaces,
      this.reload,
      this.debug,
    );
  }

  async getNamespaceInfos(namespaces, reload, debug) {
    namespaces = this.addFetchUrlToNamespaces(namespaces);
    namespaces = await this.fetchShortcuts(namespaces, reload, debug);
    namespaces = this.normalizeShortcuts(namespaces);
    namespaces = this.addIncludesToShortcuts(namespaces);
    namespaces = this.addInfoToShortcuts(namespaces);
    return namespaces;
  }

  async getNamespaceInfos2(namespaces, reload, debug) {
    Object.values(namespaceInfos).forEach((namespaceInfo) => {
      namespaceInfo.shortcuts = this.addIncludes(namespaceInfo.shortcuts);
    const namespaceInfos = await this.fetchShortcuts2(
      namespaces,
      reload,
      debug,
    );
    });
    return;
    namespaces = this.addIncludesToShortcuts(namespaces);
    namespaces = this.addInfoToShortcuts(namespaces);
    return namespaces;
  }

  getInitialNamespaceInfos(namespaces) {
    return Object.fromEntries(
      namespaces.map((namespace) => {
        const namespaceInfo = this.getInitalNamespaceInfo(namespace);
        return [namespaceInfo.name, namespaceInfo];
      }),
    );
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
   * Start fetching shortcuts per namespace.
   *
   * @param {array} namespaceInfos - The namespaces to fetch shortcuts for.
   * @param {boolean} reload   - Flag whether to call fetch() with reload. Otherwise, it will be called with 'force-cache'.
   *
   * @return {array} promises - The promises from the fetch() calls.
   */
  async startFetches2(namespaceInfos, reload) {
    const promises = [];
    for (const i of Object.keys(namespaceInfos).sort()) {
      const namespaceInfo = namespaceInfos[i];
      if (!namespaceInfo.url) {
        continue;
      }
      promises.push(
        fetch(namespaceInfo.url, { cache: reload ? 'reload' : 'force-cache' }),
      );
    }
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
      namespaces[i].shortcuts = shortcuts;
    }
    // Delete marked namespaces.
    namespaces = namespaces.filter(
      (namespace) => typeof namespace !== 'undefined',
    );
    return namespaces;
  }

  /**
   * Add a fetch URL template to a namespace.
   *
   * @param {array} namespaceInfos - The namespaces to fetch shortcuts for.
   * @param {boolean} reload   - Flag whether to call fetch() with reload. Otherwise, it will be called with 'force-cache'.
   * @param {boolean} debug    - Flag whether to print debug messages.
   *
   * @return {array} namespaces - The namespaces with their fetched shortcuts, in a new property namespace.shortcuts.
   */
  async fetchShortcuts2(namespaces, reload, debug) {

    const namespaceInfos = this.getInitialNamespaceInfos(namespaces);
    const promises = await this.startFetches2(namespaceInfos, reload);

    // Wait until all fetch calls are done.
    const responses = await Promise.all(promises);

    const namespaceNames = Object.keys(namespaceInfos).sort();
    for (const i in namespaceNames) {
      const response = responses[i];
      const namespaceName = namespaceNames[i];
      const namespaceInfo = namespaceInfos[namespaceName];
      if (!response || response.status != 200) {
        if (debug)
          Helper.log(
            (reload ? 'reload ' : 'cache  ') + 'Fail:    ' + namespaceInfo.url,
          );
        namespaceInfo.shortcuts = [];
        continue;
      }
      this.logSuccess(debug, reload, response);

      const text = await response.text();
      namespaceInfo.shortcuts = this.parseShortcutsFromYml(
        text,
        namespaceInfo.url,
      );

      namespaceInfo.shortcuts = this.verifyShortcuts(
        namespaceInfo.shortcuts,
        namespaceName,
      );
    }
    return namespaceInfos;
  }

  parseShortcutsFromYml(text, url) {
    try {
      const shortcuts = jsyaml.load(text);
      return shortcuts;
    } catch (error) {
      Helper.log('Error parsing ' + url + ':\n\n' + error.message);
      this.error = true;
      return [];
    }
  }

  logSuccess(debug, reload, response) {
    if (debug)
      Helper.log((reload ? 'reload ' : 'cache  ') + 'Success: ' + response.url);
    if (!debug) {
      Helper.log('.', false);
    }
  }

  /**
   * To every namespace, add a fetch URL template.
   */
  addFetchUrlToNamespaces(namespaces) {
    namespaces.forEach((namespace, i, namespaces) => {
      namespace = this.addFetchUrlToNamespace(namespace);
      namespaces[i] = namespace;
    });
    return namespaces;
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
   * Add a fetch URL template to a namespace.
   *
   * @param {(string|Object)} namespace - The namespace to add the URL template to.
   *
   * @return {Object} namespace - The namespace with the added URL template.
   */
  getInitalNamespaceInfo(namespace) {
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
   * Ensure shortcuts have the correct structure.
   *
   * @param {array} shortcuts      - The shortcuts to normalize.
   * @param {string} namespaceName - The namespace name to show in error message.
   *
   * @return {array} shortcuts - The normalized shortcuts.
   */
  verifyShortcuts(shortcuts, namespaceName) {
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

  normalizeShortcuts(namespaces) {
    for (const i in namespaces) {
      namespaces[i].shortcuts = this.normalizeShortcutsOfNamespace(
        namespaces[i].shortcuts,
        namespaces[i].name,
      );
    }
    return namespaces;
  }

  addIncludesToShortcuts(namespaces) {
    for (const i in namespaces) {
      this.addIncludesToShortcutsOfNamespace(namespaces[i].shortcuts);
    }
    return namespaces;
  }

  addIncludesToShortcutsOfNamespace(shortcuts) {
    for (const key in shortcuts) {
      let shortcut = shortcuts[key];
      if (shortcut.include) {
        const shortcutToInclude = shortcuts[shortcut.include.key];
        shortcut = Object.assign(shortcut, shortcutToInclude);
        // TODO: Handle different namespace.
      }
    }
  }

  addIncludes(shortcuts) {
    for (const key in shortcuts) {
      let shortcut = shortcuts[key];
      if (shortcut.include) {
        if (shortcut.include.key && shortcuts[shortcut.include.key]) {
          if (shortcut.include.namespace) {
            // TODO: Handle include with namespace.
          } else {
            const shortcutToInclude = shortcuts[shortcut.include.key];
            shortcut = Object.assign(shortcut, shortcutToInclude);
          }
        } else {
          Helper.log(`Incorrect include found at ${key}`);
          this.error = true;
          continue;
        }
      }
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

        shortcut.key = key;
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
    return namespaces;
  }
}
