export default class Helper {

  static splitKeepRemainder(string, delimiter, n) {
    if (!string) {
      return [];
    }
    var parts = string.split(delimiter);
    return parts.slice(0, n - 1).concat([parts.slice(n - 1).join(delimiter)]);
  }
}

