/** @module ParseQuery */

import Helper from "./helper.js";

/** Parse a query. */

export default class ParseQuery {
  /**
   * Get keyword and argument string from query.
   *
   * @param {string} query          - The whole query.
   *
   * @return {object}
   * - {string} keyword           - The keyword from the query.
   * - {string} argumentString    - The whole argument string.
   */
  static getKeywordAndArgumentString(query) {
    let keyword, argumentString;
    [keyword, argumentString] = Helper.splitKeepRemainder(query, " ", 2);

    return [keyword, argumentString];
  }

  /**
   * Get arguments from argument string.
   *
   * @param {string} argumentString    - The whole argument string.
   *
   * @return {array} args              - The arguments from the argument string.
   */
  static getArguments(argumentString) {
    let args;
    if (argumentString) {
      args = argumentString.split(",");
    } else {
      args = [];
    }

    return args;
  }

  /**
   * Check if keyword contains reload command.
   *
   * @param {string} keyword - The keyword.
   *
   * @return {object}
   * - {boolean} reload      - True if keyword contained reload command.
   * - {string} keyword      - The new keyword.
   */
  static checkForChacheReload(keyword) {
    let reload = false;

    if (keyword.match(/^reload$/)) {
      reload = true;
      keyword = "";
    }
    if (keyword.match(/^reload:/)) {
      [, keyword] = Helper.splitKeepRemainder(keyword, ":", 2);
      reload = true;
    }

    return [reload, keyword];
  }

  /**
   * Check if keyword contains extra namespace.
   *
   * @param {string} keyword - The keyword.
   *
   * @return {object}
   * - {string} extraNamespaceName - If found, the name of the extra namespace.
   * - {string} keyword            - The new keyword.
   */
  static getExtraNamespace(keyword) {
    // Check for extraNamespace in keyword:
    //   split at dot
    //   but don't split up country namespace names.
    let extraNamespaceName;
    if (keyword.match(/.\./)) {
      [extraNamespaceName, keyword] = Helper.splitKeepRemainder(
        keyword,
        ".",
        2
      );
      // If extraNamespace started with a dot, it will be empty
      // so let's split it again, and add the dot.
      if (extraNamespaceName == "") {
        [extraNamespaceName, keyword] = Helper.splitKeepRemainder(
          keyword,
          ".",
          2
        );
        extraNamespaceName = "." + extraNamespaceName;
      }
    }

    return [extraNamespaceName, keyword];
  }

  /**
   * Return language or country from extra namespace.
   *
   * @param {string} extraNamespaceName - The name of the extraNamespace.
   *
   * @return {object}               - Contains either {language: } or {country: }.
   */
  static getLanguageAndCountryFromExtraNamespaceName(extraNamespaceName) {
    const env = {};

    // Set language and country again.
    switch (extraNamespaceName.length) {
      case 2:
        env.language = extraNamespaceName;
        break;
      case 3:
        // Cut the dot at the beginning.
        env.country = extraNamespaceName.substring(1);
        break;
    }
    return env;
  }

  /**
   * Parse the query into its all details.
   *
   * @param {string} query          - The whole query.
   *
   * @return {object}               - Contains various values parsed from the query.
   */
  static parse(query) {
    const env = {};

    [env.keyword, env.argumentString] = ParseQuery.getKeywordAndArgumentString(
      query
    );
    env.args = ParseQuery.getArguments(env.argumentString);
    [env.reload, env.keyword] = ParseQuery.checkForChacheReload(env.keyword);

    [env.extraNamespaceName, env.keyword] = ParseQuery.getExtraNamespace(
      env.keyword
    );
    if (env.extraNamespaceName) {
      let languageOrCountry = ParseQuery.getLanguageAndCountryFromExtraNamespaceName(
        env.extraNamespaceName
      );
      Object.assign(env, languageOrCountry);
    }

    return env;
  }
}
