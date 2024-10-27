// @ts-nocheck

export default class GitLogger {
  constructor(gitInfo) {
    this.gitInfo = gitInfo;
  }
  logVersion() {
    console.log("Trovu running version", this.getVersion());
  }

  getVersion() {
    return `${this.gitInfo.commit.hash} ${this.gitInfo.commit.date}`;
  }
}
