import child_process from "child_process";

export default class DataReporter {
  static getGitInfo() {
    const commitHash = child_process.execSync("git rev-parse HEAD");
    const date = child_process.execSync("git show -s --format=%ci");
    const git = {
      commit: { hash: commitHash.toString().trim().slice(0, 7), date: date.toString().trim() },
    };
    return git;
  }
}
