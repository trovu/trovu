import pkg from "../../../package.json";

export default class GitLogger {
  static logVersion() {
    console.log("Trovu running version", this.getVersion());
  }

  static getVersion() {
    return `${pkg.gitCommitHash.slice(0, 7)} ${pkg.gitDate}`;
  }
}
