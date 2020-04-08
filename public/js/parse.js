import Helper from "./helper.js";

/** Parse a query. */
class Parse {

  static getKeywordAndArgumentString(query) {

    let keyword, argumentString;
    [keyword, argumentString] = Helper.splitKeepRemainder(
      query,
      " ",
      2
    );

    return [keyword, argumentString];
  }

  static getArguments(argumentString) {

    let args;
    if (argumentString) {
      args = argumentString.split(",");
    } else {
      args = [];
    }

    return args;
  }

  static checkForChacheReload(keyword) {

    let reload = false;
    if (keyword.match(/^reload:/)) {
      [, keyword] = Helper.splitKeepRemainder(keyword, ":", 2);
      reload = true;
    }

    return [reload, keyword];
  }

  static getExtraNamespace(keyword) {

    // Check for extraNamespace in keyword:
    //   split at dot
    //   but don't split up country namespace names.
    let extraNamespaceName;
    if (keyword.match(/.\./)) {
      [extraNamespaceName, keyword] = Helper.splitKeepRemainder(keyword, ".", 2);
      // If extraNamespace started with a dot, it will be empty
      // so let's split it again, and add the dot.
      if (extraNamespaceName == "") {
        [extraNamespaceName, keyword] = Helper.splitKeepRemainder(keyword, ".", 2);
        extraNamespaceName = "." + extraNamespaceName;
      }
    }

    return [extraNamespaceName, keyword];
  }

  static getLanguageAndCountryFromExtraNamespaceName(extraNamespaceName) {

    const env = {};

    // Set language and country again.
    switch (extraNamespaceName.length) {
      case 2:
        env.language = extraNamespaceName;
        break;
      case 3:
        // Cut the dot at the beginning.
        env.country = extraNamespaceName.substring(1);
        break;
    }
    return env;
  }
}

export default Parse;