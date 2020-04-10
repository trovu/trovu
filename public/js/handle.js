import Load from "./load.js";
import Helper from "./helper.js";
import Parse from "./parse.js";
import Find from "./find.js";

/** Class for handling a call. */
export default class Handle {
  /**
   * Set the environment.
   *
   * @param {object} env        - The environment.
   */
  constructor(env) {
    this.env = env;
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
    const pattern = "{" + prefix + "(.+?)}";
    const re = RegExp(pattern, "g");
    let match;
    const placeholders = {};
    while ((match = re.exec(str))) {
      const { name, placeholder } = this.getPlaceholderFromMatch(match);
      placeholders[name] = placeholders[name] || {};
      placeholders[name][match[0]] = placeholder;
    }
    return placeholders;
  }

  getPlaceholderFromMatch(match) {
    // Example value:
    // match[1] = 'query|encoding=utf-8|another=attribute'
    const nameAndAttributes = match[1].split("|");
    // Example value:
    // name = 'query'
    const name = nameAndAttributes.shift();
    const placeholder = {};
    // Example value:
    // name_and_attributes = ['encoding=utf-8', 'another=attribute']
    for (const attrStr of nameAndAttributes) {
      const [attrName, attrValue] = attrStr.split("=", 2);
      placeholder[attrName] = attrValue;
    }
    return { name, placeholder };
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

  /**
   * Replace arguments in a string.
   *
   * @param {string} str    - The string containing placeholders.
   * @param {array}  args   - The arguments to replace.
   *
   * @return {string} str   - The string with the replaced placeholders.
   */
  async replaceArguments(str, args, env) {
    const placeholders = this.getArgumentsFromString(str);

    for (const argumentName in placeholders) {
      let argument = args.shift().trim();

      // An argument can have multiple matches,
      // so go over all of them.
      var matches = placeholders[argumentName];
      for (let match in matches) {
        argument = await this.processAttributes(argument, matches[match], env);
        while (str.includes(match)) {
          str = str.replace(match, argument);
        }
      }
    }
    return str;
  }

  async processAttributes(processedArgument, attributes, env) {
    processedArgument = await this.processAttributeType(attributes, processedArgument, env);
    processedArgument = this.processAttributeTransform(attributes, processedArgument);
    processedArgument = this.processAttributeEncoding(attributes, processedArgument);
    return processedArgument;
  }

  async processAttributeType(attributes, processedArgument, env) {
    const locale = env.language + "-" + env.country.toUpperCase();
    switch (attributes.type) {
      case "date":
        processedArgument = await this.processTypeDate(
          processedArgument,
          locale,
          attributes
        );
        break;
      case "time":
        processedArgument = await this.processTypeTime(
          processedArgument,
          locale,
          attributes
        );
        break;
      case "city":
        processedArgument = await this.processTypeCity(processedArgument, env);
        break;
    }
    return processedArgument;
  }

  async processTypeDate(processedArgument, locale, attributes) {
    const dateModule = await import("./type/date.js");
    let date = await dateModule.default.parse(processedArgument, locale);
    // If date could be parsed:
    // Set argument.
    if (date && date.format() != "Invalid date") {
      let format = "YYYY-MM-DD";
      if (attributes.output) {
        format = attributes.output;
      }
      processedArgument = date.format(format);
    }
    return processedArgument;
  }

  async processTypeTime(processedArgument, locale, attributes) {
    const timeModule = await import("./type/time.js");
    let time = await timeModule.default.parse(processedArgument, locale);
    // If time could be parsed:
    // Set argument.
    if (time && time.format() != "Invalid time") {
      let format = "HH:mm";
      if (attributes.output) {
        format = attributes.output;
      }
      processedArgument = time.format(format);
    }
    return processedArgument;
  }

  async processTypeCity(processedArgument, env) {
    const cityModule = await import("./type/city.js");
    let city = await cityModule.default.parse(
      processedArgument,
      env.country,
      env.reload,
      env.debug
    );
    // If city could be parsed:
    // Set argument.
    if (city) {
      processedArgument = city;
    }
    return processedArgument;
  }

  processAttributeTransform(attributes, processedArgument) {
    switch (attributes.transform) {
      case "uppercase":
        processedArgument = processedArgument.toUpperCase();
        break;
      case "lowercase":
        processedArgument = processedArgument.toLowerCase();
        break;
    }
    return processedArgument;
  }
  processAttributeEncoding(attributes, processedArgument) {
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
    return processedArgument;
  }

  /**
   * Replace variables in a string.
   *
   * @param {string} str        - The string containing placeholders.
   * @param {array}  variables  - The variables to replace.
   *
   * @return {string} str       - The string with the replaced variables.
   */
  async replaceVariables(str, variables) {
    var placeholders = this.getVariablesFromString(str);

    for (let varName in placeholders) {
      var matches = placeholders[varName];
      for (let match in matches) {
        var attributes = matches[match];
        switch (varName) {
          case "now":
            // Load momentjs.
            const momentjsUrl =
              "https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.22.2/moment-with-locales.min.js";
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
        str = str.replace(new RegExp(Helper.escapeRegExp(match), "g"), value);
      }
    }
    return str;
  }




  /**
   * Given this.env, get the redirect URL.
   *
   * @return {string} redirectUrl - The URL to redirect to.
   */
  async getRedirectUrl() {
    if (!this.env.query) {
      return;
    }

    Object.assign(this.env, Parse.parse(this.env.query));

    // Add extraNamespace if parsed in query.
    if (this.env.extraNamespaceName) {
      this.env.extraNamespace = this.env.addFetchUrlTemplateToNamespace(this.env.extraNamespaceName);
      this.env.namespaces.push(this.env.extraNamespace);
    }

    const shortcuts = await Find.collectShortcuts(this.env);
    let redirectUrl = Find.pickShortcut(shortcuts, this.env.namespaces);

    if (!redirectUrl) return;

    if (this.env.debug) Helper.log("");
    if (this.env.debug) Helper.log("Used template: " + redirectUrl);

    redirectUrl = await this.replaceVariables(redirectUrl, { language: this.env.language, country: this.env.country });
    redirectUrl = await this.replaceArguments(redirectUrl, this.env.args, this.env);

    return redirectUrl;
  }
}