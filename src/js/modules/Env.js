/** @module Env */
import pkg from '../../../package.json';
import Helper from './Helper.js';
import Logger from './Logger.js';
import NamespaceFetcher from './NamespaceFetcher.js';
import QueryParser from './QueryParser.js';
import countriesList from 'countries-list';
import jsyaml from 'js-yaml';

/** Set and remember the environment. */

export default class Env {
  /**
   * Set helper variables.
   *
   * @param {object} env - The environment variables.
   */
  constructor(env) {
    this.setToThis(env);
    if (pkg.gitCommitHash) {
      this.commitHash = pkg.gitCommitHash.slice(0, 7);
    } else {
      this.commitHash = 'unknown';
    }

    this.logger = new Logger('#log');
  }

  /**
   * Set the environment variables from the given object.
   *
   * @param {object} env - The environment variables.
   * @returns {void}
   */
  setToThis(env) {
    if (!env) {
      return;
    }
    for (const key in env) {
      this[key] = env[key];
    }
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
  getParamStr(moreParams) {
    const params = this.getParams();
    Object.assign(params, moreParams);
    const paramStr = Env.getUrlParamStr(params);
    return paramStr;
  }

  getProcessUrl(moreParams) {
    const paramStr = this.getParamStr(moreParams);
    const processUrl = 'process/index.html?#' + paramStr;
    return processUrl;
  }

  /**
   * Set the initial class environment vars either from params or from GET hash string.
   *
   * @param {array} params - List of parameters to be used in environment.
   */
  async populate(params) {
    if (!params) {
      params = Env.getUrlParams();
    }

    // Set debug and reload from URL params.
    for (const paramName of ['debug', 'reload']) {
      if (params[paramName] === '1') {
        this[paramName] = true;
      }
    }

    // Assign before, to also catch "debug" and "reload" in params and query.
    Object.assign(this, params);
    const params_from_query = QueryParser.parse(this.query);
    Object.assign(this, params_from_query);

    if (typeof params.github === 'string' && params.github !== '') {
      this.configUrl = this.getGithubConfigUrl(params.github);
    }
    if (typeof params.configUrl === 'string' && params.configUrl !== '') {
      this.configUrl = params.configUrl;
    }
    if (this.configUrl) {
      const config = await this.getUserConfigFromUrl(this.configUrl);
      if (config) {
        Object.assign(this, config);
      }
    }
    // Assign again, to override user config.
    Object.assign(this, params);
    Object.assign(this, params_from_query);

    await this.setDefaults();

    // Add extra namespace to namespaces.
    if (this.extraNamespaceName) {
      this.namespaces.push(this.extraNamespaceName);
    }

    this.data = await this.getData();
    this.namespaceInfos = await new NamespaceFetcher(this).getNamespaceInfos(
      this.namespaces,
    );

    // Remove extra namespace if it turned out to be invalid.
    if (
      this.extraNamespaceName &&
      !this.isValidNamespace(this.extraNamespaceName)
    ) {
      delete this.extraNamespaceName;
      this.keyword = '';
      this.arguments = [this.query];
    }
  }

  /**
   * Get the URL to the config file on Github.
   * @param {string} github - The Github user name.
   * @returns {string} The URL to the config file.
   */
  getGithubConfigUrl(github) {
    const configUrl = `https://raw.githubusercontent.com/${github}/trovu-data-user/master/config.yml?${this.commitHash}`;
    return configUrl;
  }

  /**
     Check if namespace is valid.
   * @param {string} namespace 
   * @returns {boolean}
   */
  isValidNamespace(namespace) {
    if (
      namespace in this.namespaceInfos &&
      this.namespaceInfos[namespace].shortcuts &&
      !this.isEmptyObject(this.namespaceInfos[namespace].shortcuts)
    ) {
      return true;
    }
    if (namespace in countriesList.languages) {
      return true;
    } else if (
      namespace.substring(1).toUpperCase() in countriesList.countries
    ) {
      return true;
    }
    return false;
  }

  /**
   * Checks if object is empty.
   * @param {Object} obj
   * @returns {boolean}
   */
  isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
  }

  /**
   * Get the user configuration from a URL.
   * @param {string} configUrl - The URL to the config file.
   * @returns {(object|boolean)} config - The user's config object, or false if fetch failed.
   */

  async getUserConfigFromUrl(configUrl) {
    const configYml = await Helper.fetchAsync(configUrl, this);
    if (!configYml) {
      this.logger.error(`Error reading config from ${configUrl}`);
    }
    try {
      const config = jsyaml.load(configYml);
      return config;
    } catch (error) {
      this.logger.error(`Error parsing ${configUrl}: ${error.message}`);
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
   * Fetches data from /data.
   * @returns {Object} An object containing the fetched data.
   */
  async getData() {
    let text;
    let url;
    if (typeof window !== 'undefined') {
      url = `/data.json?${this.commitHash}`;
      text = await Helper.fetchAsync(url, this);
    } else {
      // eslint-disable-next-line no-undef
      const fs = require('fs');
      url = './dist/public/data.json';
      text = fs.readFileSync(url, 'utf8');
    }
    if (!text) {
      return false;
    }
    try {
      const data = await JSON.parse(text);
      return data;
    } catch (error) {
      this.env.logger.error(`Error parsing JSON in ${url}: ${error.message}`);
      return false;
    }
  }

  /**
   * From 'http://example.com/foo#bar=baz' get 'bar=baz'.
   *
   * @return {string} hash - The hash string.
   */
  static getUrlHash() {
    const hash = window.location.hash.substr(1);
    return hash;
  }

  /**
   * Get parameters from the URL query string.
   *
   * @return {object} params - List of found parameters.
   */
  static getUrlParams() {
    const urlParamStr = this.getUrlHash();
    const urlParams = new URLSearchParams(urlParamStr);
    const params = {};
    urlParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }

  /**
   * Build URL param string from param object.
   *
   * @param {object} params       - List of parameters.
   *
   * @return {string} urlParamStr - Parameter as URL string.
   */
  static getUrlParamStr(params) {
    const urlParams = new URLSearchParams();
    for (const key in params) {
      urlParams.set(key, params[key]);
    }
    urlParams.sort();
    return urlParams;
  }
}
