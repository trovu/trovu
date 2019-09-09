import Helper from "./helper.js";

/** Set and remember the environment. */
class Env {
  /**
   * Set helper variables.
   */
  constructor() {
    this.configUrlTemplate =
      "https://raw.githubusercontent.com/{%github}/trovu-data-user/master/config.yml";
    this.fetchUrlTemplateDefault =
      "https://raw.githubusercontent.com/trovu/trovu-data/master/shortcuts/{%namespace}/{%keyword}/{%argumentCount}.yml";
  }

  /**
   * Set the initial class environment vars either from params or from GET hash string.
   *
   * @param {array} [params] - List of parameters to be used in environment.
   */
  async populate(params) {
    if (!params) {
      params = this.getParams();
    }

    await this.setWithUserConfigFromGithub(params);

    // Override all with params.
    Object.assign(this, params);

    this.setDefaults();
    this.addFetchUrlTemplatesToNamespaces(params);
  }

  /**
   * Set default environment variables if they are still empty.
   */
  setDefaults() {
    // Default language.
    if (typeof this.language != "string") {
      this.language = this.getDefaultLanguage();
    }
    // Default country.
    if (typeof this.country != "string") {
      this.country = this.getDefaultCountry();
    }
    // Default namespaces.
    if (typeof this.namespaces != "object") {
      this.namespaces = ["o", this.language, "." + this.country];
    }
  }

  /**
   * Set the user configuration from their fork in their Github profile.
   *
   * @param {array} params - Here, 'github' and 'debug' will be used
   *
   * @return {boolean} [getUserConfigFailed] - True if fetch failed.
   */
  async setWithUserConfigFromGithub(params) {
    // TODO: Check for string and non-emptiness.
    if (!params.github) {
      return;
    }
    let configUrl = this.configUrlTemplate.replace("{%github}", params.github);
    let configYml = await Helper.fetchAsync(configUrl, false, params.debug);
    if (configYml) {
      Object.assign(this, jsyaml.load(configYml));
    } else {
      delete this.github;
      alert("Failed to read Github config from " + configUrl);
    }
  }

  /**
   * Create URL query string from an array.
   *
   * @param {array} params - The parameters.
   *
   * @return {string} paramStr - The created URL query string.
   */
  jqueryParam(a) {
    var s = [];
    var add = function(k, v) {
      v = typeof v === "function" ? v() : v;
      v = v === null ? "" : v === undefined ? "" : v;
      s[s.length] = encodeURIComponent(k) + "=" + encodeURIComponent(v);
    };
    var buildParams = function(prefix, obj) {
      var i, len, key;

      if (prefix) {
        if (Array.isArray(obj)) {
          for (i = 0, len = obj.length; i < len; i++) {
            buildParams(
              prefix +
                "[" +
                (typeof obj[i] === "object" && obj[i] ? i : "") +
                "]",
              obj[i]
            );
          }
        } else if (String(obj) === "[object Object]") {
          for (key in obj) {
            buildParams(prefix + "[" + key + "]", obj[key]);
          }
        } else {
          add(prefix, obj);
        }
      } else if (Array.isArray(obj)) {
        for (i = 0, len = obj.length; i < len; i++) {
          add(obj[i].name, obj[i].value);
        }
      } else {
        for (key in obj) {
          buildParams(key, obj[key]);
        }
      }
      return s;
    };

    return buildParams("", a).join("&");
  }

  /**
   * Parse parameters from a URL query str.
   * Based on: https://stackoverflow.com/a/3355892/52023
   *
   * @param {string} paramStr - The URL query string to parse.
   *
   * @return {array} params - The parsed parameters.
   */
  jqueryDeparam(paramStr) {
    // Prepare params.
    var params = {};

    // Get pairs.
    var keyValueStrings = paramStr.split("&");

    // Iterate over all pairs.
    for (let keyValueString of keyValueStrings) {
      let [name, value] = keyValueString.split("=");

      if (typeof value == "undefined") {
        value = "";
      }

      // Decode.
      name = decodeURIComponent(name);
      value = value.replace(/\+/g, "%20");
      value = decodeURIComponent(value);

      name = name.trim();

      // Skip empty.
      if ("" == name) {
        continue;
      }

      // Prepare indices.
      let indices = [];

      // Move indices from string into array.
      name = name.replace(/\[([^\]]*)\]/g, function(k, idx) {
        indices.push(idx);
        return "";
      });

      indices.unshift(name);
      var o = params;

      for (var j = 0; j < indices.length - 1; j++) {
        var idx = indices[j];
        if (!o[idx]) {
          o[idx] = {};
        }
        o = o[idx];
      }

      idx = indices[indices.length - 1];
      if (idx == "") {
        o.push(value);
      } else {
        o[idx] = value;
      }
    }
    return params;
  }

  // Param getters ====================================================

  /**
   * Get parameters from the URL query string.
   *
   * @return {array} params - List of found parameters.
   */
  getParams() {
    var paramStr = window.location.hash.substr(1);
    let params = this.jqueryDeparam(paramStr);
    return params;
  }

  /**
   * Get the default language and country from browser.
   *
   * @return {array} [language, country] - The default language and country.
   */
  getDefaultLanguageAndCountry() {
    let languageStr = navigator.language;
    let language, country;
    if (languageStr) {
      [language, country] = languageStr.split("-");
    }

    // Set defaults.
    language = language || "en";
    country = country || "us";

    // Ensure lowercase.
    language = language.toLowerCase();
    country = country.toLowerCase();
    return {
      language: language,
      country: country
    };
  }

  /**
   * Get the default language.
   *
   * @return {string} language - The default language.
   */
  getDefaultLanguage() {
    let languageCountry = this.getDefaultLanguageAndCountry();
    return languageCountry.language;
  }

  /**
   * Get the default country.
   *
   * @return {string} language - The default country.
   */
  getDefaultCountry() {
    let languageCountry = this.getDefaultLanguageAndCountry();
    return languageCountry.country;
  }

  /**
   * To every namespace, add a fetch URL template.
   */
  addFetchUrlTemplatesToNamespaces() {
    this.namespaces.forEach((namespace, i, namespaces) => {
      // Site namespaces, from trovu-data.
      if (typeof namespace == "string") {
        if (namespace.length < 4) {
          let name = namespace;
          namespace = {
            name: name,
            url:
              "https://raw.githubusercontent.com/trovu/trovu-data/master/shortcuts/" +
              name +
              "/{%keyword}/{%argumentCount}.yml"
          };
          namespace.type = "site";
        }
        // User namespaces may also have completely custom URL (template).
        // Must contain {%keyword} and {%argumentCount}.
      } else if (namespace.url && namespace.name) {
        namespace.type = "user";
        // User namespaces, from custom trovu-data-user.
      } else if (namespace.github) {
        if (namespace.github == ".") {
          // Set to current user.
          namespace.github = this.github;
        }
        // Default to Github name.
        if (!namespace.name) {
          namespace.name = namespace.github;
        }
        namespace.url =
          "https://raw.githubusercontent.com/" +
          namespace.github +
          "/trovu-data-user/master/shortcuts/{%keyword}.{%argumentCount}.yml";
        namespace.type = "user";
      }
      namespaces[i] = namespace;
    });
  }

  /**
   * Export current class without methods.
   *
   * @return {object} - Object of env without methods.
   */
  withoutFunctions() {
    let envWithoutFunctions = {};
    for (let key of Object.keys(this)) {
      if (typeof this[key] != "function") {
        envWithoutFunctions[key] = this[key];
      }
    }
    return envWithoutFunctions;
  }
}

export default Env;
