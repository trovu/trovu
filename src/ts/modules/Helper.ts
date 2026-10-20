/** @module Helper */

/** Helper methods. */

export const REMOTE_FETCH_TIMEOUT = 5000;

/**
 * Opens a URL externally when running in PWA/standalone mode.
 * In PWA mode, window.location.href/replace keeps the user inside the PWA.
 * Using window.open with '_blank' opens in the default browser/app on Android.
 *
 * @param {string} url - The URL to open
 * @param {boolean} isStandalone - Whether the app is running in standalone/PWA mode
 * @returns {boolean} True if opened externally, false if navigated in-place
 */
export function openExternal(url: string, isStandalone: boolean): boolean {
  if (isStandalone) {
    window.open(url, "_blank");
    return true;
  }
  return false;
}

export default class Helper {
  /**
   * Fetch the content of a file behind an URL.
   *
   * @param {string} url    - The URL of the file to fetch.
   * @param {object} env    - Environment object containing:
   *                          reload: boolean - Whether to bypass cache
   *                          logger: {info: Function, success: Function} - Logging methods
   *
   * @return {string} text  - The content.
   */
  static async fetchAsync(url, env, options: { cache?: RequestCache; catchErrors?: boolean; timeout?: number } = {}) {
    const response = await this.fetchResponse(url, env, options);
    if (!response) {
      return null;
    }
    const requestCache = options.cache || (env.reload ? "reload" : "force-cache");
    env.logger.success(`Success fetching via ${requestCache} ${url}`);
    const text = await response.text();
    return text;
  }

  static async fetchResponse(url, env, options: { cache?: RequestCache; catchErrors?: boolean; timeout?: number } = {}) {
    const requestCache = options.cache || (env.reload ? "reload" : "force-cache");
    const controller = options.timeout ? new AbortController() : undefined;
    const timeoutId = options.timeout ? setTimeout(() => controller?.abort(), options.timeout) : undefined;
    try {
      const response = await fetch(url, {
        cache: requestCache,
        ...(controller ? { signal: controller.signal } : {}),
      });
      if (!response) {
        env.logger.info(`Problem fetching via ${requestCache} ${url}`);
        return null;
      }
      if (response.status !== 200) {
        env.logger.info(`Problem fetching via ${requestCache} ${url}: ${response.status}`);
        return null;
      }
      return response;
    } catch (error) {
      if (!options.catchErrors) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      env.logger.warning(`Problem fetching via ${requestCache} ${url}: ${message}`);
      return null;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }
}
