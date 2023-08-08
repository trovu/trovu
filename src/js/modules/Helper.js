/** @module Helper */

import pkg from '../../../package.json';

/** Helper methods. */

export default class Helper {
  /**
   * Split a string n times, keep all additional matches in the last part as one string.
   *
   * @param {string} str        - The string to split.
   * @param {string} delimiter  - The string or regexp to split at.
   * @param {int} n             - Max. number of resulting parts.
   *
   * @return {array} parts      - The splitted parts.
   */
  static splitKeepRemainder(string, delimiter, n) {
    if (!string) {
      return [];
    }
    const parts = string.split(delimiter);
    return parts.slice(0, n - 1).concat([parts.slice(n - 1).join(delimiter)]);
  }

  /**
   * Escape all regular expression commands in a string.
   *
   * @param {string} str    - The string to escape.
   *
   * @return {string} str   - The escaped string.
   */
  static escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
  }

  /**
   * Fetch the content of a file behind an URL.
   *
   * @param {string} url    - The URL of the file to fetch.
   *
   * @return {string} text  - The content.
   */
  static async fetchAsync(url, env) {
    const response = await fetch(url, {
      cache: env.reload ? 'reload' : 'force-cache',
    });
    if (response.status != 200) {
      env.logger.warning(
        `Error fetching via ${env.reload ? 'reload' : 'cache'} ${url}: ${
          response.status
        }`,
      );
      return null;
    }
    env.logger.success(
      `Success fetching via ${env.reload ? 'reload' : 'cache'} ${url}`,
    );
    const text = await response.text();
    return text;
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

  static logVersion() {
    console.log(
      `Trovu running version`,
      pkg.gitCommitHash.slice(0, 7),
      pkg.gitDate,
    );
  }
}
