/** @module Env */
import Helper, { REMOTE_FETCH_TIMEOUT } from "./Helper";
import Logger from "./Logger";
import NamespaceFetcher from "./NamespaceFetcher";
import QueryParser from "./QueryParser";
import UrlProcessor from "./UrlProcessor";
import * as countriesList from "countries-list";
import jsyaml from "js-yaml";
import type {
  ContextName,
  EnvParams,
  EnvPopulateOptions,
  GitInfo,
  NamespaceMap,
  NamespaceReference,
  QueryParseResult,
  TrovuConfig,
  TrovuData,
} from "../types";
import { URL_PARAM_DEFINITIONS, URL_PARAM_NAMES } from "../types";

/** Set and remember the environment. */

const countriesListData = (countriesList as { default?: typeof countriesList }).default || countriesList;
const countries = countriesListData.countries;
const languages = countriesListData.languages;

export default class Env {
  [key: string]: any;
  logger: Logger;
  gitInfo: GitInfo;
  data: TrovuData;
  namespaceInfos: NamespaceMap;
  context?: ContextName;
  namespaces!: NamespaceReference[];
  github?: string;
  configUrl?: string;
  language!: string;
  country!: string;
  debug?: boolean;
  reload?: boolean;
  query!: string;
  keyword!: string;
  args!: string[];
  argumentString!: string;
  defaultKeyword?: string;
  extraNamespaceName?: string;
  alternative?: string;
  status?: string;

  /**
   * Set helper variables.
   *
   * @param {object} env - The environment variables.
   */
  constructor(env: Partial<EnvParams> & Partial<QueryParseResult> & Partial<Pick<Env, "data" | "namespaceInfos">> = {}) {
    if (languages && !languages["eo"]) {
      languages["eo"] = { name: "Esperanto", native: "Esperanto" };
    }
    this.setToThis(env);
    this.logger = new Logger("#log");
    this.configureLogger();
    this.setGit();
  }

  setGit() {
    if (typeof GIT_INFO === "object") {
      this.gitInfo = GIT_INFO;
    } else {
      this.gitInfo = {
        commit: {
          hash: "unknown",
          date: "unknown",
        },
      };
    }
  }

  /**
   * Set the environment variables from the given object.
   *
   * @param {object} env - The environment variables.
   * @returns {void}
   */
  setToThis(env: Record<string, unknown>) {
    if (!env) {
      return;
    }
    for (const key in env) {
      this[key] = env[key];
    }
  }

  configureLogger() {
    if (!this.logger) {
      return;
    }
    this.logger.setConsoleLevels(this.debug ? ["info", "success", "warning", "error"] : ["warning", "error"]);
  }

  /**
   * Get the params from env.
   *
   * @return {object} - The built params.
   */
  buildUrlParams(originalParams: EnvParams = {}, moreParams: EnvParams = {}): EnvParams {
    const params: EnvParams = {};

    if (this.github) {
      params.github = this.github;
    } else if (originalParams.configUrl) {
      params.configUrl = originalParams.configUrl;
    } else {
      params.language = this.language;
      params.country = this.country;
    }
    if (originalParams.defaultKeyword) {
      params.defaultKeyword = originalParams.defaultKeyword;
    }
    if (this.debug) {
      params.debug = 1;
    }
    for (const property of ["alternative", "context", "key", "namespace", "status", "query"]) {
      if (!this[property]) continue;
      if (property === "context" && this[property] === "index") continue;
      params[property] = this[property];
    }
    Object.assign(params, moreParams);
    return params;
  }

  /**
   * Get the parameters as string.
   */
  buildUrlParamStr(moreParams: EnvParams = {}): string {
    const originalParams = Env.getParamsFromUrl();
    const params = this.buildUrlParams(originalParams, moreParams);
    const urlSearchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) urlSearchParams.set(key, String(value));
    });
    urlSearchParams.sort();
    const paramStr = urlSearchParams.toString();
    return paramStr;
  }

  buildProcessUrl(moreParams: EnvParams): string {
    const paramStr = this.buildUrlParamStr(moreParams);
    const processUrl = "process/index.html?#" + paramStr;
    return processUrl;
  }

  async setContext() {
    const { context } = Env.getParamsFromUrl();
    if (context) {
      this.context = context;
    }
  }

  /**
   * Set the initial class environment vars either from params or from GET hash string.
   *
   * @param {array} params - List of parameters to be used in environment.
   */
  async populate(params: EnvParams, options: EnvPopulateOptions = {}) {
    this.namespaces = undefined;
    this.github = undefined;
    this.configUrl = undefined;
    this.language = undefined;
    this.country = undefined;

    const paramsFromQuery = this.getQueryParams(params);
    const preloadParams = this.getPreloadParams(params, paramsFromQuery);
    Object.assign(this, preloadParams);
    this.configureLogger();

    this.getFromLocalStorage();

    if (typeof this.github === "string" && this.github !== "") {
      this.configUrl = this.buildGithubConfigUrl(this.github);
    }
    if (typeof params.configUrl === "string" && params.configUrl !== "") {
      this.configUrl = params.configUrl;
    }

    const dataPromise = this.data ? Promise.resolve(this.data) : this.getData();
    const configPromise = this.configUrl ? this.getUserConfigFromUrl(this.configUrl) : Promise.resolve(undefined);
    const [data, config] = await Promise.all([dataPromise, configPromise]);
    this.data = data || ({} as TrovuData);

    // Raycast cannot handle too much data.
    if (options && options.removeNamespaces) {
      for (const namespace of options.removeNamespaces) {
        if (namespace in this.data.shortcuts) {
          delete this.data.shortcuts[namespace];
        }
      }
    }

    if (this.data.config?.defaultKeyword) {
      this.defaultKeyword = this.data.config.defaultKeyword;
    }

    if (config) {
      Object.assign(this, config);
    }
    // Assign again, to override user config.
    Object.assign(this, params);
    Object.assign(this, paramsFromQuery);

    this.setDefaults();

    this.setToLocalStorage();

    // Add extra namespace to namespaces.
    if (this.extraNamespaceName) {
      this.namespaces.push(this.extraNamespaceName);
    }

    this.namespaceInfos = await new NamespaceFetcher(this).getNamespaceInfos(this.namespaces);

    // Remove extra namespace if it turned out to be invalid.
    if (this.extraNamespaceName && !this.isValidNamespace(this.extraNamespaceName)) {
      delete this.extraNamespaceName;
      this.keyword = "";
      this.arguments = [this.query];
    }
  }

  getQueryParams(params: Pick<EnvParams, "query">): QueryParseResult {
    return QueryParser.parse(typeof params.query === "string" ? params.query : "");
  }

  getPreloadParams(
    params: EnvParams,
    paramsFromQuery: QueryParseResult,
  ): EnvParams {
    return {
      ...Env.getBoolParams(params),
      ...params,
      ...paramsFromQuery,
    };
  }

  setToLocalStorage() {
    if (typeof localStorage === "undefined") {
      return;
    }
    if (this.github) {
      localStorage.setItem("github", this.github);
      localStorage.removeItem("language");
      localStorage.removeItem("country");
    } else {
      localStorage.setItem("language", this.language);
      localStorage.setItem("country", this.country);
      localStorage.removeItem("github");
    }
  }

  getFromLocalStorage() {
    if (typeof localStorage === "undefined") {
      return;
    }
    this.language ||= localStorage.getItem("language");
    this.country ||= localStorage.getItem("country");
    this.github ||= localStorage.getItem("github");
  }

  static getBoolParams(params: EnvParams): Partial<EnvParams> {
    const boolParams: Partial<EnvParams> = {};
    const mutableBoolParams = boolParams as Record<string, boolean>;
    for (const paramName of URL_PARAM_NAMES) {
      if (!URL_PARAM_DEFINITIONS[paramName].isBoolean) {
        continue;
      }
      if (params[paramName] === "1") {
        mutableBoolParams[paramName] = true;
      }
    }
    return boolParams;
  }

  static pickUrlParams(params: Record<string, unknown>): EnvParams {
    const pickedParams: EnvParams = {};
    const mutablePickedParams = pickedParams as Record<string, unknown>;
    for (const paramName of URL_PARAM_NAMES) {
      const value = params[paramName];
      if (value !== undefined) {
        mutablePickedParams[paramName] = value;
      }
    }
    return pickedParams;
  }

  /**
   * Get the URL to the config file on Github.
   * @param {string} github - The Github user name.
   * @returns {string} The URL to the config file.
   */
  buildGithubConfigUrl(github: string) {
    const configUrl = `https://raw.githubusercontent.com/${github}/trovu-data-user/master/config.yml`;
    return configUrl;
  }

  /**
     Check if namespace is valid.
   * @param {string} namespace 
   * @returns {boolean}
   */
  isValidNamespace(namespace: string) {
    if (
      namespace in this.namespaceInfos &&
      this.namespaceInfos[namespace].shortcuts &&
      !this.isEmptyObject(this.namespaceInfos[namespace].shortcuts)
    ) {
      return true;
    }
    if (namespace in languages) {
      return true;
    } else if (namespace.substring(1).toUpperCase() in countries) {
      return true;
    }
    return false;
  }

  /**
   * Checks if object is empty.
   * @param {Object} obj
   * @returns {boolean}
   */
  isEmptyObject(obj: Record<string, unknown>) {
    return Object.keys(obj).length === 0;
  }

  /**
   * Get the user configuration from a URL.
   * @param {string} configUrl - The URL to the config file.
   * @returns {(object|boolean)} config - The user's config object, or false if fetch failed.
   */

  async getUserConfigFromUrl(configUrl: string): Promise<TrovuConfig | undefined> {
    const configYml = await Helper.fetchAsync(configUrl, this, {
      catchErrors: true,
      timeout: REMOTE_FETCH_TIMEOUT,
    });
    if (!configYml) {
      this.logger.warning(`Problem reading config from ${configUrl}`);
    }
    try {
      const config = jsyaml.load(configYml) as TrovuConfig;
      return config;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error parsing ${configUrl}: ${message}`);
    }
  }

  /**
   * Set default language and country if they are still empty.
   * @returns {void}
   */
  setDefaultLanguageAndCountry() {
    if (this.language in languages && typeof this.country === "string" && this.country.toUpperCase() in countries) {
      return;
    }

    const { language, country } = this.getDefaultLanguageAndCountry();

    // Default language.
    if (!(this.language in languages)) {
      this.language = language;
    }
    // Default country.
    if (!this.country || !(this.country.toUpperCase() in countries)) {
      this.country = country;
    }
  }

  /**
   * Get the default language and country from browser.
   *
   * @return {object} [language, country] - The default language and country.
   */
  getDefaultLanguageAndCountry(): { language: string; country: string } {
    let { language, country } = this.getLanguageAndCountryFromBrowser();

    // Make sure language and country are in our lists.
    if (!(language in languages)) {
      language = this.data.config.language;
    }
    if (!country || !(country.toUpperCase() in countries)) {
      country = this.data.config.country;
    }

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
  getLanguageAndCountryFromBrowser(): { language?: string; country?: string } {
    const languageStr = this.getNavigatorLanguage();
    let language, country;
    if (languageStr) {
      if (typeof Intl !== "undefined" && typeof Intl.Locale === "function") {
        try {
          const locale = new Intl.Locale(languageStr);
          language = locale.language;
          country = locale.region;

          if (!country) {
            country = this.guessCountryFromLanguage(languageStr);
          }
        } catch {
          [language, country] = languageStr.split("-");
        }
      } else {
        [language, country] = languageStr.split("-");
      }
    }

    return { language, country };
  }

  /**
   * Guess the likely country for a language or locale.
   *
   * @param {string} language - The language or locale to guess a country for.
   * @return {string|undefined} country - The guessed country, if available.
   */
  guessCountryFromLanguage(language: string): string | undefined {
    if (typeof Intl === "undefined" || typeof Intl.Locale !== "function") {
      return;
    }

    try {
      const locale = new Intl.Locale(language);
      if (typeof locale.maximize !== "function") {
        return;
      }

      const country = locale.maximize().region;
      if (country && country.toUpperCase() in countries) {
        return country;
      }
    } catch {
      return;
    }
  }

  /**
   * Wrapper for navigator language, capsuled to enable unit testing.
   *
   * @return {string} navigatorLanguage - The browser's value of navigator.language.
   */
  getNavigatorLanguage() {
    if (typeof navigator === "undefined") {
      return "";
    }
    const languageStr = navigator.language;
    return languageStr;
  }

  /**
   * Set default environment variables if they are still empty.
   */
  setDefaults() {
    this.setDefaultLanguageAndCountry();

    // Default namespaces.
    if (typeof this.namespaces != "object") {
      this.namespaces = this.data.config?.namespaces || [];
      this.namespaces = this.namespaces.map((namespace) =>
        typeof namespace === "string" ? UrlProcessor.replaceVariables(namespace, this) : namespace,
      );
    }
    // Default debug.
    if (typeof this.debug != "boolean") {
      this.debug = Boolean(this.debug);
    }
  }

  /**
   * Fetches data from /data.
   * @returns {Object} An object containing the fetched data.
   */
  async getData(): Promise<TrovuData | false> {
    const loadFromUrl = async (url: string, prefix: string) => {
      const dataPromise = Helper.fetchAsync(url, this);
      Env.fetchLog(this.context, prefix);
      return {
        text: await dataPromise,
        url,
      };
    };

    let dataSource: { text: string | false | null; url: string };
    switch (this.context) {
      case "index":
      case "process":
      case "web-ext": {
        const prefix = "/";
        dataSource = await loadFromUrl(`${prefix}data.json?version=${this.gitInfo.commit.hash}`, prefix);
        break;
      }
      case "raycast": {
        const prefix = "https://trovu.net/";
        dataSource = await loadFromUrl(`${prefix}data.json`, prefix);
        break;
      }
      case "node": {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const fs = require("fs");
        const url = "./dist/public/data.json";
        dataSource = {
          text: fs.readFileSync(url, "utf8"),
          url,
        };
        break;
      }
      default:
        return false;
    }
    if (!dataSource.text) {
      return false;
    }
    try {
      const data = JSON.parse(dataSource.text) as TrovuData;
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error parsing JSON in ${dataSource.url}: ${message}`);
      return false;
    }
  }

  /**
   * Fetches log.json with context.
   *
   * @param context
   */
  static fetchLog(context: string, prefix: string) {
    const url = `${prefix}log.json?context=${context}`;
    fetch(url);
  }

  /**
   * From 'http://example.com/foo#bar=baz' get 'bar=baz'.
   *
   * @return {string} hash - The hash string.
   */
  static getUrlHash() {
    if (typeof window === "undefined") {
      return "";
    }
    const hash = window.location.hash.substr(1);
    return hash;
  }

  static getParamsFromUrl(): EnvParams {
    const urlSearchParams = this.getUrlSearchParams();
    const params: Record<string, string> = {};
    urlSearchParams.forEach((value, key) => {
      params[key] = value;
    });
    return this.pickUrlParams(params);
  }

  static getUrlSearchParams() {
    const urlHash = this.getUrlHash();
    const urlSearchParams = new URLSearchParams(urlHash);
    return urlSearchParams;
  }

  isRunningStandalone() {
    return window.navigator.standalone || window.matchMedia("(display-mode: standalone)").matches;
  }
}
