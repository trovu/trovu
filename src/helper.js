/** @module Helper */

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
    let parts = string.split(delimiter);
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
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  }

  /**
   * Output text into the #log element.
   *
   * @param {string} str      - The string to output.
   * @param {boolean} newLine - Whether to prefix it with a line break.
   */
  static log(str, newLine = true) {
    if (!document.querySelector("#log")) {
      return;
    }
    if (newLine) {
      document.querySelector("#log").textContent += "\n";
    }
    document.querySelector("#log").textContent += str;
  }

  /**
   * Fetch the content of a file behind an URL.
   *
   * @param {string} url    - The URL of the file to fetch.
   *
   * @return {string} text  - The content.
   */
  static async fetchAsync(url, reload, debug = false) {
    const response = await fetch(url, {
      cache: reload ? "reload" : "force-cache"
    });
    if (response.status != 200) {
      if (debug) this.log((reload ? "reload " : "cache  ") + "Fail:    " + url);
      return null;
    }
    if (debug) this.log((reload ? "reload " : "cache  ") + "Success: " + url);
    if (!debug) {
      this.log(".", false);
    }
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
   * @return {array} params - List of found parameters.
   */
  static getUrlParams() {
    const urlParamStr = this.getUrlHash();
    const urlParams = this.jqueryDeparam(urlParamStr);
    return urlParams;
  }


  /**
   * Create URL query string from an array.
   *
   * @param {array} params - The parameters.
   *
   * @return {string} paramStr - The created URL query string.
   */
  static jqueryParam(a) {
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
  static jqueryDeparam(paramStr) {
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
      value = value.replace(/\+/g, " ");
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
}