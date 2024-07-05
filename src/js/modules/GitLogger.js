import pkg from "../../../package.json";

export default class GitLogger {
  constructor(git) {
    this.git = git;
  }
  logVersion() {
    console.log("Trovu running version", this.getVersion());
  }

  getVersion() {
    return `${this.git.commit.hash} ${this.git.commit.date}`;
  }
}
