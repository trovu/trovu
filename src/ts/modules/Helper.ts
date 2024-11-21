// @ts-nocheck
/** @module Helper */

/** Helper methods. */

export default class Helper {
  /**
   * Fetch the content of a file behind an URL.
   *
   * @param {string} url    - The URL of the file to fetch.
   *
   * @return {string} text  - The content.
   */
  static async fetchAsync(url, env) {
    const requestCache = env.reload ? "reload" : "default";
    const response = await env.fetch(url, {
      cache: requestCache,
    });
    if (response.status != 200) {
      env.logger.info(`Problem fetching via ${requestCache} ${url}: ${response.status}`);
      return null;
    }
    env.logger.success(`Success fetching via ${requestCache} ${url}`);
    const text = await response.text();
    return text;
  }

  /**
   * Handles how URLs are opened.
   *
   * @param {string} url – The URL being navigated to.
   */
  static openUrl(url) {
    if (this.isInStandaloneMode()) {
      window.open(url);
      return;
    }

    window.location.href = url;
  }

  /**
   * Checks if application is inside PWA or not.
   * Ref: https://stackoverflow.com/a/52695341/7596193
   */
  static isInStandaloneMode() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone ||
      document.referrer.includes("android-app://")
    );
  }
}
