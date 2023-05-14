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
    this.namespaceInfos = this.processIncludes(this.namespaceInfos);
    this.namespaceInfos = this.addReachable(this.namespaceInfos);
    this.namespaceInfos = this.addInfos(this.namespaceInfos);
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
        throw new Error(`NamespaceFetcher loop ran already ${i} times.`);
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
        if (this.env.debug)
          Helper.log(
            (this.env.reload ? 'reload ' : 'cache  ') +
              'Fail:    ' +
              namespaceInfo.url,
          );
        namespaceInfo.shortcuts = [];
        continue;
      }
      this.logSuccess(response);

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

  addNamespacesFromInclude(shortcut) {
    if (shortcut.include && shortcut.include.namespace) {
      const namespaceInfo = this.getInitalNamespaceInfo(
        shortcut.include.namespace,
      );
      if (!this.namespaceInfos[namespaceInfo.name]) {
        this.namespaceInfos[namespaceInfo.name] = namespaceInfo;
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

  processIncludes(namespaceInfos) {
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

  processInclude(shortcut, namespaceName, namespaceInfos) {
    if (!shortcut.include.key) {
      Helper.log(`Include with missing key at: ${key}`);
      this.error = true;
      return false;
    }
    const keyUnprocessed = shortcut.include.key;
    const key = UrlProcessor.replaceVariables(keyUnprocessed, {
      language: this.env.language,
      country: this.env.country,
    });
    namespaceName = shortcut.include.namespace || namespaceName;
    let shortcutToInclude = namespaceInfos[namespaceName].shortcuts[key];
    if (!shortcutToInclude) {
      return false;
    }
    if (shortcutToInclude.include) {
      shortcutToInclude = this.processInclude(
        shortcutToInclude,
        namespaceName,
        namespaceInfos,
      );
    }
    const shortcutToIncludeCloned = this.cloneShortcut(shortcutToInclude);
    shortcut = Object.assign(shortcutToIncludeCloned, shortcut);
    delete shortcut.include;
    return shortcut;
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

  addInfos(namespaceInfos) {
    for (const namespaceInfo of Object.values(this.namespaceInfos)) {
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
      Helper.log('Error parsing ' + url + ':\n\n' + error.message);
      this.error = true;
      return [];
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
    const incorrectKeys = [];
    for (const key in shortcuts) {
      if (!key.match(/\S+ \d/)) {
        incorrectKeys.push(key);
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

  logSuccess(response) {
    if (this.env.debug)
      Helper.log(
        (this.env.reload ? 'reload ' : 'cache  ') + 'Success: ' + response.url,
      );
    if (!this.env.debug) {
      Helper.log('.', false);
    }
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
