import type { GitInfo } from "../types";

export default class GitLogger {
  gitInfo: GitInfo;

  constructor(gitInfo: GitInfo) {
    this.gitInfo = gitInfo;
  }
  logVersion() {
    console.log("Trovu running version", this.getVersion());
  }

  getVersion() {
    return `${this.gitInfo.commit.hash} ${this.gitInfo.commit.date}`;
  }
}
