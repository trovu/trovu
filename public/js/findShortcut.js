/** @module FindShortcut */

import Helper from "./helper.js";

/** Find matching shortcut. */

export default class FindShortcut {

  /**
   * Match shortcuts for keyword and args.
   *
   * @param {string} keyword    - The keyword of the query.
   * @param {array} args        - The arguments of the query.
   *
   * @return {array} shortcuts  - The array of found shortcuts.
   */
  static async matchShortcuts(keyword, args, namespaces, reload, debug) {

    const shortcuts = {};
    for (let namespace of namespaces) {
      // If shortcuts are empty.
      // (e.g. because of previous fetch error)
      if (!namespace.shortcuts) {
        continue;
      }
      const shortcut = namespace.shortcuts[keyword + ' ' + args.length]
      if (shortcut) {
        shortcuts[namespace.name] = shortcut;
      }
    }
    return shortcuts;
  }

  /**
   * Collect shortcuts from all available namespace.
   *
   * @param {object} env        - The environment.
   *
   * @return {object} shortcuts - Found shortcuts keyed by their source namespace.
   */
  static async collectShortcuts(env) {

    let shortcuts = await this.matchShortcuts(env.keyword, env.args, env.namespaces, env.reload, env.debug);

    // If nothing found:
    // Try without commas, i.e. with the whole argumentString as the only argument.
    if (Object.keys(shortcuts).length === 0 && env.args.length > 0) {
      if (env.debug) Helper.log('Not found yet, trying via whole argument string.');
      env.args = [env.argumentString];
      shortcuts = await this.matchShortcuts(env.keyword, env.args, env.namespaces, env.reload, env.debug);
    }

    // If nothing found:
    // Try default keyword.
    if (Object.keys(shortcuts).length === 0 && env.defaultKeyword) {
      if (env.debug) Helper.log('Not found yet, trying via default keyword.');
      env.args = [env.query];
      shortcuts = await this.matchShortcuts(
        env.defaultKeyword,
        env.args, 
        env.namespaces,
        env.reload,
        env.debug
      );
    }

    return shortcuts;
  }

  /**
   * Collect shortcuts from all available namespaces.
   *
   * @param {object} shortcuts        - The collected shortcuts.
   * @param {array} namespaces        - The set namespaces.
   *
   * @return {string} redirectUrl     - The redirect URL of the picked namespace.
   */
  static pickShortcut(shortcuts, namespaces) {

    // Find first shortcut in our namespace hierarchy.
    for (let namespace of namespaces.reverse()) {
      if (shortcuts[namespace.name]) {
        return shortcuts[namespace.name]["url"];
        // TODO: Process POST arguments.
      }
    }
  }
}