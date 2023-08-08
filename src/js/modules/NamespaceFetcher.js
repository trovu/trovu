/** @module NamespaceFetcher */

import Helper from './Helper.js';
import UrlProcessor from './UrlProcessor.js';
import jsyaml from 'js-yaml';

export default class NamespaceFetcher {
  constructor(env) {
    this.env = env;
    this.namespaceInfos = {};
  }

  /**
   * Gets namespace information for given namespaces
   * @param {Array} namespaces - An array of namespace names
   * @returns {Object} An object containing namespace information
   */
  async getNamespaceInfos(namespaces) {
    this.namespaceInfos = this.getInitialNamespaceInfos(namespaces, 1);
    this.namespaceInfos = await this.fetchNamespaceInfos(this.namespaceInfos);
    this.namespaceInfos = this.processIncludeAll(this.namespaceInfos);
    this.namespaceInfos = this.addReachable(this.namespaceInfos);
    this.namespaceInfos = this.addInfoAll(this.namespaceInfos);
    this.verifyAll(this.namespaceInfos);
    return this.namespaceInfos;
  }

  /**
   * Gets initial namespace information for given namespaces
   * @param {Array} namespaces - An array of namespace names
   * @param {number} priorityOffset - The offset to be used when setting the priority.
   * @returns {Object} An object containing initial namespace information for each given namespace
   */
  getInitialNamespaceInfos(namespaces, priorityOffset) {
    return Object.fromEntries(
      namespaces.map((namespace, index) => {
        const namespaceInfo = this.getInitalNamespaceInfo(namespace);
        namespaceInfo.priority = index + priorityOffset;
        return [namespaceInfo.name, namespaceInfo];
      }),
    );
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
      namespace.github = this.env.github;
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
   * Fetches the information for the given namespaces from an external source
   * @param {Object} namespaceInfos - An object of initial namespace infos.
   * @returns {Object} An object containing the fetched information for each given namespace
   */
  async fetchNamespaceInfos(namespaceInfos) {
    for (
      let i = 0;
      Object.values(namespaceInfos).filter((item) => !('shortcuts' in item))
        .length > 0 && i <= 10;
      i++
    ) {
      if (i >= 10) {
        this.env.logger.error(`NamespaceFetcher loop ran already ${i} times.`);
      }
      const newNamespaceInfos = Object.values(namespaceInfos).filter(
        (item) => !('shortcuts' in item),
      );
      const promises = this.startFetches(newNamespaceInfos);
      const responses = await Promise.all(promises);
      await this.processResponses(newNamespaceInfos, responses);
      for (const namespaceInfo of newNamespaceInfos) {
        namespaceInfos[namespaceInfo.name] = namespaceInfo;
      }
    }
    return namespaceInfos;
  }

  /**
   * Start fetching shortcuts per namespace.
   *
   * @param {array} newNamespaceInfos - The namespaces to fetch shortcuts for.
   *
   * @return {array} promises - The promises from the fetch() calls.
   */
  startFetches(newNamespaceInfos) {
    const promises = [];
    for (const namespaceInfo of newNamespaceInfos) {
      const promise = fetch(namespaceInfo.url, {
        cache: this.env.reload ? 'reload' : 'force-cache',
      });
      promises.push(promise);
    }
    return promises;
  }

  /**
   * Processes responses and updates namespace information.
   *
   * @param {Object} newNamespaceInfos - An object containing new namespace information.
   * @param {Array} responses - An array of responses to process.
   *
   * @returns {Object} The updated namespace information object.
   */
  async processResponses(newNamespaceInfos, responses) {
    for (const namespaceInfo of newNamespaceInfos) {
      const response = responses.shift();
      if (!response || response.status != 200) {
        this.env.logger.warning(
          `Error fetching via ${this.env.reload ? 'reload' : 'cache'} ${
            namespaceInfo.url
          }`,
        );
        namespaceInfo.shortcuts = [];
        continue;
      }
      this.env.logger.success(
        `Success fetching via ${this.env.reload ? 'reload' : 'cache'} ${
          namespaceInfo.url
        }`,
      );

      const text = await response.text();
      namespaceInfo.shortcuts = this.parseShortcutsFromYml(
        text,
        namespaceInfo.url,
      );

      namespaceInfo.shortcuts = this.checkKeySyntax(
        namespaceInfo.shortcuts,
        namespaceInfo.name,
      );
      for (const key in namespaceInfo.shortcuts) {
        namespaceInfo.shortcuts[key] = this.convertToObject(
          namespaceInfo.shortcuts[key],
        );
        this.addNamespacesFromInclude(namespaceInfo.shortcuts[key]);
      }
    }
    return newNamespaceInfos;
  }

  /**
   * Parse a YAML string.
   *
   * @param {string} text - String to parse.
   * @param {string} url - The URL of the YAML, for error reporting.
   *
   * @return {object} namespaces - The parsed shortcuts.
   */
  parseShortcutsFromYml(text, url) {
    try {
      const shortcuts = jsyaml.load(text);
      return shortcuts;
    } catch (error) {
      this.env.logger.error(`Parse error in ${url}: ${error.message}`);
    }
  }

  /**
   * Ensure shortcuts have the correct structure.
   *
   * @param {array} shortcuts      - The shortcuts to normalize.
   * @param {string} namespaceName - The namespace name to show in error message.
   *
   * @return {array} shortcuts - The normalized shortcuts.
   */
  checkKeySyntax(shortcuts, namespaceName) {
    for (const key in shortcuts) {
      if (!key.match(/\S+ \d/)) {
        this.env.logger.error(
          `Incorrect key "${key}" in namespace ${namespaceName}: Must have form "KEYWORD ARGUMENTCOUNT".`,
        );
      }
    }
    return shortcuts;
  }

  addNamespacesFromInclude(shortcut) {
    const includes = this.getIncludes(shortcut);
    for (const include of includes) {
      if (include && include.namespace) {
        const namespaceInfo = this.getInitalNamespaceInfo(include.namespace);
        if (!this.namespaceInfos[namespaceInfo.name]) {
          this.namespaceInfos[namespaceInfo.name] = namespaceInfo;
        }
      }
    }
  }

  /**
   * Converts a given shortcut to an object
   * @param {string|Object} shortcut - The shortcut to convert
   * @returns {Object} The converted shortcut object
   */
  convertToObject(shortcut) {
    if (typeof shortcut === 'string') {
      const url = shortcut;
      shortcut = {
        url: url,
      };
    }
    return shortcut;
  }

  processIncludeAll(namespaceInfos) {
    for (const namespaceName in namespaceInfos) {
      const namespaceInfo = namespaceInfos[namespaceName];
      const shortcuts = namespaceInfo.shortcuts;
      for (const key in shortcuts) {
        const shortcut = shortcuts[key];
        if (!shortcut.include) {
          continue;
        }
        shortcuts[key] = this.processInclude(
          shortcut,
          namespaceName,
          namespaceInfos,
        );
        if (!shortcuts[key]) {
          delete shortcuts[key];
        }
      }
    }
    return namespaceInfos;
  }

  processInclude(shortcut, namespaceName, namespaceInfos, depth = 0) {
    if (depth >= 10) {
      this.env.logger.error(
        `NamespaceFetcher loop ran already ${depth} times.`,
      );
    }
    const includes = this.getIncludes(shortcut);
    for (const include of includes) {
      if (!include.key) {
        this.env.error(`Include with missing key at: ${key}`);
      }
      const keyUnprocessed = include.key;
      const key = UrlProcessor.replaceVariables(keyUnprocessed, {
        language: this.env.language,
        country: this.env.country,
      });
      namespaceName = include.namespace || namespaceName;
      if (!namespaceInfos[namespaceName]) {
        this.env.logger.warning(`Namespace "${namespaceName}" does not exist.`);
        continue;
      }
      let shortcutToInclude = namespaceInfos[namespaceName].shortcuts[key];
      if (!shortcutToInclude) {
        continue;
      }
      if (shortcutToInclude.include) {
        shortcutToInclude = this.processInclude(
          shortcutToInclude,
          namespaceName,
          namespaceInfos,
          depth + 1,
        );
      }
      if (Object.keys(shortcutToInclude).length === 0) {
        continue;
      }
      const shortcutToIncludeCloned = this.cloneShortcut(shortcutToInclude);
      shortcut = Object.assign(shortcutToIncludeCloned, shortcut);
      return shortcut;
    }
    return false;
  }

  getIncludes(shortcut) {
    let includes = [];
    if (Array.isArray(shortcut.include)) {
      includes = shortcut.include;
    } else {
      includes.push(shortcut.include);
    }
    return includes;
  }

  /**
   * Clones a given shortcut object
   * @param {Object} shortcut - The shortcut object to clone
   * @returns {Object} The cloned shortcut object
   */
  cloneShortcut(shortcut) {
    // This approach seems more browser-supported than structuredClone().
    const str = JSON.stringify(shortcut);
    const clonedShortcut = JSON.parse(str);
    return clonedShortcut;
  }

  /**
   * Enrich shortcuts with their own information: argument & namespace names, reachable.
   *
   * @param {object} namespaces - Current namespaces keyed by their name.
   */
  addReachable(namespaceInfos) {
    const namespaceInfosByPriority = Object.values(namespaceInfos).sort(
      (a, b) => {
        return b.priority - a.priority;
      },
    );

    // Remember found shortcuts
    // to know which ones are reachable.
    const foundShortcuts = new Set();

    for (const namespaceInfo of namespaceInfosByPriority) {
      if (!this.isSubscribed(namespaceInfo)) {
        continue;
      }
      for (const key in namespaceInfo.shortcuts) {
        // If not yet present: reachable.
        namespaceInfo.shortcuts[key].reachable = !foundShortcuts.has(key);
        foundShortcuts.add(key);
      }
    }
    return namespaceInfos;
  }

  addInfoAll(namespaceInfos) {
    for (const namespaceInfo of Object.values(namespaceInfos)) {
      for (const key in namespaceInfo.shortcuts) {
        namespaceInfo.shortcuts[key] = this.addInfo(
          namespaceInfo.shortcuts[key],
          key,
          namespaceInfo.name,
        );
      }
    }
    return namespaceInfos;
  }

  /**
   *  Add info like keyword, arguments to a shortcut.
   *
   * @param {object} shortcut - The shortcut.
   * @param {string} key - The shortcut key.
   * @param {object} namespaceInfo - The namespace info.
   *
   * @return {object} shortcut - Shortcut with info.
   */
  addInfo(shortcut, key, namespaceName) {
    shortcut.key = key;
    [shortcut.keyword, shortcut.argumentCount] = key.split(' ');
    shortcut.argumentCount = parseInt(shortcut.argumentCount);
    shortcut.namespace = namespaceName;
    shortcut.arguments = UrlProcessor.getArgumentsFromString(shortcut.url);
    shortcut.title = shortcut.title || '';
    return shortcut;
  }

  verifyAll(namespaceInfos) {
    for (const namespaceInfo of Object.values(namespaceInfos)) {
      for (const key in namespaceInfo.shortcuts) {
        this.verify(namespaceInfo.shortcuts[key]);
      }
    }
    return namespaceInfos;
  }

  verify(shortcut) {
    if (!shortcut.url && !shortcut.deprecated) {
      this.env.logger.error(
        `Missing url or deprecated in ${shortcut.namespace}.${shortcut.key}.`,
      );
    }
    // Remove until not having proper logging
    // as it might break given faulty user shortcuts.
    // if (
    //   shortcut.url &&
    //   shortcut.argumentCount != Object.keys(shortcut.arguments).length
    // ) {
    //   throw new Error(
    //     `Mismatch in argumentCount of key and arguments.length of url in ${shortcut.namespace}.${shortcut.key} .`,
    //   );
    // }
  }

  /**
   * Check if namespace is subscribed to.
   *
   * @param {object} namespaceInfo - namespace to be checked.
   *
   * @return {boolean} isSubscribed - TRUE if subscribed.
   */
  isSubscribed(namespaceInfo) {
    return namespaceInfo.priority && namespaceInfo.priority > 0;
  }
}
