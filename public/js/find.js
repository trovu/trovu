import Helper from "./helper.js";

/** Find matching shortcut. */

class Find {

  /**
   * Build fetch URL given the necessary parameters.
   *
   * @param {object} namespace        - The namespace to use.
   * @param {string} keyword          - The keyword to use.
   * @param {string} argumentCount    - The argumentCount to use.
   *
   * @return {string} fetchUrl        - The URL with the replaced placeholders.
   */
  static buildFetchUrl(namespace, keyword, argumentCount) {
    let fetchUrl = namespace.url;

    fetchUrl = fetchUrl.replace(
      "{%namespace}",
      encodeURIComponent(namespace.name)
    );
    fetchUrl = fetchUrl.replace("{%keyword}", encodeURIComponent(keyword));
    fetchUrl = fetchUrl.replace("{%argumentCount}", argumentCount);

    return fetchUrl;
  }

  /**
   * Fetch shortcuts matching keyword and args.
   *
   * @param {string} keyword    - The keyword of the query.
   * @param {array} args        - The arguments of the query.
   *
   * @return {array} shortcuts  - The array of found shortcuts.
   */
  static async fetchShortcuts(keyword, args, namespaces, reload, debug) {

    // Fetch all available shortcuts for our query and namespace settings.
    var shortcuts = [];
    let promises = [];
    for (let namespace of namespaces) {
      var fetchUrl = this.buildFetchUrl(namespace, keyword, args.length);
      if (debug) {
        Helper.log("Request: " + fetchUrl);
      } else {
        Helper.log(".", false);
      }

      // Start synchronous fetch calls.
      promises.push(
        fetch(fetchUrl, { cache: reload ? "reload" : "force-cache" })
      );
    }

    // Wait until all fetch calls are done.
    const responses = await Promise.all(promises);

    // Collect responses.
    for (let i in namespaces) {
      let namespace = namespaces[i];
      if (responses[i].status != 200) {
        if (debug) Helper.log("Fail:    " + responses[i].url);
        continue;
      }
      if (debug) Helper.log("Success: " + responses[i].url);
      const text = await responses[i].text();
      shortcuts[namespace.name] = jsyaml.load(text);
    }
    return shortcuts;
  }

  static async collectShortcuts(env) {

    let shortcuts = await this.fetchShortcuts(env.keyword, env.args, env.namespaces, env.reload, env.debug);

    // If nothing found:
    // Try without commas, i.e. with the whole argumentString as the only argument.
    if (Object.keys(shortcuts).length === 0 && env.args.length > 0) {
      env.args = [env.argumentString];
      shortcuts = await this.fetchShortcuts(env.keyword, env.args, env.namespaces, env.reload, env.debug);
    }

    // If nothing found:
    // Try default keyword.
    if (Object.keys(shortcuts).length === 0 && env.defaultKeyword) {
      env.args = [env.query];
      shortcuts = await this.fetchShortcuts(
        env.defaultKeyword,
        env.args, 
        env.namespaces,
        env.reload,
        env.debug
      );
    }

    return shortcuts;
  }

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

export default Find;