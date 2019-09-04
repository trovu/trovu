import Load from "./load.js";
import Helper from "./helper.js";

export default class Handle {
  constructor(env) {
    this.env = env;
  }

  /**
   * Build fetch URL given the necessary parameters.
   *
   * @param {string} namespace        - The namespace to use.
   * @param {string} keyword          - The keyword to use.
   * @param {string} argumentCount    - The argumentCount to use.
   * @param {string} fetchUrlTemplate - A template containing placeholders for all the above.
   *
   * @return {string} fetchUrl        - The URL with the replaced placeholders.
   */
  buildFetchUrl(namespace, keyword, argumentCount, fetchUrlTemplate) {
    if (!fetchUrlTemplate) {
      fetchUrlTemplate = this.env.fetchUrlTemplateDefault;
    }

    namespace = encodeURIComponent(namespace);
    keyword = encodeURIComponent(keyword);

    var replacements = {
      "{%namespace}": namespace,
      "{%keyword}": keyword,
      "{%argumentCount}": argumentCount
    };
    let fetchUrl = fetchUrlTemplate;
    // Replace all occurences in replacements.
    Object.keys(replacements).map(key => {
      fetchUrl = fetchUrl.replace(key, replacements[key]);
    });

    return fetchUrl;
  }

  /**
   * Get placeholder names from a string.
   *
   * @param {string} str    - The string containing placeholders.
   * @param {string} prefix - The prefix of the placeholders. Must be Regex-escaped.
   *
   * @return {object} placeholders - Array keyed with the arguments names and with an array of corresponding placeholders.
   *
   *   If the placeholder with the same name occurs multiple times, there are also
   *   multiple arrays in the nested array.
   *
   *   Example:
   *     http://{%first|type=foo}{%first|type=bar}
   *   becomes: {
   *     first: {
   *       '{%first|type=foo}': {
   *         type: foo
   *       }
   *       '{%first|type=bar}': {
   *         type: bar
   *       }
   *     }
   *   }
   */
  getPlaceholdersFromString(str, prefix) {
    var pattern = "{" + prefix + "(.+?)}";
    var re = RegExp(pattern, "g");
    var match;
    var placeholders = {};

    do {
      match = re.exec(str);
      if (!match) {
        break;
      }

      // Example value:
      // match[1] = 'query|encoding=utf-8|another=attribute'
      var nameAndAttributes = match[1].split("|");

      // Example value:
      // name = 'query'
      var name = nameAndAttributes.shift();

      var placeholder = {};
      // Example value:
      // name_and_attributes = ['encoding=utf-8', 'another=attribute']
      for (let attrStr of nameAndAttributes) {
        let attrName, attrValue;
        [attrName, attrValue] = attrStr.split("=", 2);
        placeholder[attrName] = attrValue;
      }
      placeholders[name] = placeholders[name] || {};
      placeholders[name][match[0]] = placeholder;
    } while (match);

    return placeholders;
  }

  /**
   * Get argument names from a string.
   *
   * @param {string} str    - The string containing placeholders.
   *
   * @return {object} placeholders - Array keyed with the arguments names and with an array of corresponding placeholders.
   */
  getArgumentsFromString(str) {
    return this.getPlaceholdersFromString(str, "%");
  }

  /**
   * Get variable names from a string.
   *
   * @param {string} str    - The string containing placeholders.
   *
   * @return {object} placeholders - Array keyed with the arguments names and with an array of corresponding placeholders.
   */
  getVariablesFromString(str) {
    return this.getPlaceholdersFromString(str, "\\$");
  }

  async replaceArguments(str, args) {
    let locale = this.env.language + "-" + this.env.country.toUpperCase();

    var placeholders = this.getArgumentsFromString(str);

    for (let argumentName in placeholders) {
      var argument = args.shift();

      // Copy argument, because different placeholders can cause
      // different processing.
      var processedArgument = argument;

      processedArgument = processedArgument.trim();

      // An argument can have multiple matches,
      // so go over all of them.
      var matches = placeholders[argumentName];
      let match;
      for (let match in matches) {
        var attributes = matches[match];
        switch (attributes.type) {
          case "date":
            const dateModule = await import("./type/date.js");
            let date = await dateModule.default.parse(
              processedArgument,
              locale
            );

            // If date could be parsed:
            // Set argument.
            if (date && date.format() != "Invalid date") {
              let format = "YYYY-MM-DD";
              if (attributes.output) {
                format = attributes.output;
              }
              processedArgument = date.format(format);
            }

            break;

          case "time":
            const timeModule = await import("./type/time.js");
            let time = await timeModule.default.parse(
              processedArgument,
              locale
            );

            // If time could be parsed:
            // Set argument.
            if (time && time.format() != "Invalid time") {
              let format = "HH:mm";
              if (attributes.output) {
                format = attributes.output;
              }
              processedArgument = time.format(format);
            }

            break;

          case "city":
            const cityModule = await import("./type/city.js");
            let city = await cityModule.default.parse(
              processedArgument,
              this.env.country,
              this.env.reload,
              this.env.debug
            );

            // If city could be parsed:
            // Set argument.
            if (city) {
              processedArgument = city;
            }

            break;
        }
        switch (attributes.transform) {
          case "uppercase":
            processedArgument = processedArgument.toUpperCase();
            break;
          case "lowercase":
            processedArgument = processedArgument.toLowerCase();
            break;
        }
        switch (attributes.encoding) {
          case "iso-8859-1":
            processedArgument = escape(processedArgument);
            break;
          case "none":
            break;
          default:
            processedArgument = encodeURIComponent(processedArgument);
            break;
        }
        str = str.replace(match, processedArgument);
      }
    }
    return str;
  }

  async replaceVariables(str, variables) {
    var placeholders = this.getVariablesFromString(str);

    for (let varName in placeholders) {
      var matches = placeholders[varName];
      for (let match in matches) {
        var attributes = matches[match];
        switch (varName) {
          case "now":
            // Load momentjs.
            if (typeof moment !== "function") {
              await Load.loadScripts([momentjsUrl]);
            }

            let time = moment();

            let format = "HH:mm";
            if (attributes.output) {
              format = attributes.output;
            }
            var value = time.format(format);

            break;

          default:
            var value = variables[varName];
            break;
        }
        str = str.replace(new RegExp(this.escapeRegExp(match), "g"), value);
      }
    }
    return str;
  }

  escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  }

  async fetchShortcuts(keyword, args) {
    // Fetch all available shortcuts for our query and namespace settings.
    var shortcuts = [];
    let found = false;
    let promises = [];
    for (let namespace of this.env.namespaces) {
      var fetchUrl = this.buildFetchUrl(
        namespace,
        keyword,
        args.length,
        namespace.url
      );
      if (this.env.debug) {
        Helper.log("Request: " + fetchUrl);
      } else {
        Helper.log(".", false);
      }
      // Start synchronous fetch calls.
      promises.push(
        fetch(fetchUrl, { cache: this.env.reload ? "reload" : "force-cache" })
      );
    }

    // Wait until all fetch calls are done.
    const responses = await Promise.all(promises);

    // Collect responses.
    for (let i in this.env.namespaces) {
      let namespace = this.env.namespaces[i];
      if (responses[i].status != 200) {
        if (this.env.debug) Helper.log("Fail:    " + responses[i].url);
        continue;
      }
      if (this.env.debug) Helper.log("Success: " + responses[i].url);
      const text = await responses[i].text();
      shortcuts[namespace.name] = jsyaml.load(text);

      if (!found) {
        found = Boolean(shortcuts[namespace.name]);
      }
    }
    return [shortcuts, found];
  }

  async getRedirectUrl() {
    if (!this.env.query) {
      return;
    }

    var variables = {
      language: this.env.language,
      country: this.env.country
    };

    let keyword, argumentString;
    [keyword, argumentString] = Helper.splitKeepRemainder(
      this.env.query,
      " ",
      2
    );
    if (argumentString) {
      var args = argumentString.split(",");
    } else {
      var args = [];
    }

    // Check for (cache) reload call.
    this.env.reload = false;
    if (keyword.match(/^reload:/)) {
      let reload;
      [reload, keyword] = Helper.splitKeepRemainder(keyword, ":", 2);
      this.env.reload = true;
    }
    // Check for extraNamespace in keyword:
    //   split at dot
    //   but don't split up country namespace names.
    if (keyword.match(/.\./)) {
      let extraNamespace;
      [extraNamespace, keyword] = Helper.splitKeepRemainder(keyword, ".", 2);
      // If extraNamespace started with a dot, it will be empty
      // so let's split it again, and add the dot.
      if (extraNamespace == "") {
        [extraNamespace, keyword] = Helper.splitKeepRemainder(keyword, ".", 2);
        // And we know that namespaces starting with a dot are countries,
        // so let's update our coutry.
        this.env.country = extraNamespace;
        extraNamespace = "." + extraNamespace;
      }

      // Add to namespaces.
      this.env.namespaces.push(extraNamespace);

      // Set variables.
      switch (extraNamespace.length) {
        case 2:
          variables.language = extraNamespace;
          break;
        case 3:
          // TODO: cut dot?
          variables.country = extraNamespace;
          break;
      }
    }

    let shortcuts, found;
    [shortcuts, found] = await this.fetchShortcuts(keyword, args);

    // If nothing found:
    // Try without commas, i.e. with the whole argumentString as the only argument.
    if (!found && args.length > 0) {
      args = [argumentString];
      [shortcuts, found] = await this.fetchShortcuts(keyword, args);
    }

    // If nothing found:
    // Try default keyword.
    if (!found && this.env.defaultKeyword) {
      args = [this.env.query];
      [shortcuts, found] = await this.fetchShortcuts(
        this.env.defaultKeyword,
        args
      );
    }

    let redirectUrl = null;

    // Find first shortcut in our namespace hierarchy.
    for (let namespace of this.env.namespaces.reverse()) {
      if (shortcuts[namespace.name]) {
        redirectUrl = shortcuts[namespace.name]["url"];
        // TODO: Process POST arguments.
        break;
      }
    }

    if (!redirectUrl) {
      return;
    }

    if (this.env.debug) Helper.log("");
    if (this.env.debug) Helper.log("Used template: " + redirectUrl);

    redirectUrl = await this.replaceVariables(redirectUrl, variables);
    redirectUrl = await this.replaceArguments(redirectUrl, args);

    return redirectUrl;
  }
}
