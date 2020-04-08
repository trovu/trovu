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

}

export default Parse;