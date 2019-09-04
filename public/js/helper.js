export default class Helper {
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
    if (debug) {
      this.log("Request: " + url);
    } else {
      this.log(".", false);
    }
    const response = await fetch(url, {
      cache: reload ? "reload" : "force-cache"
    });
    //console.log(url);
    //console.log(response.headers.get('Expires'));
    if (response.status != 200) {
      if (debug) this.log("Fail:    " + url);
      return null;
    }
    if (debug) this.log("Success: " + url);
    const text = await response.text();
    return text;
  }
}
