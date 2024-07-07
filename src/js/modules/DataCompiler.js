import child_process from "child_process";
import fs from "fs";
import jsyaml from "js-yaml";

export default class DataReporter {
  static getGitInfo() {
    const commitHash = child_process.execSync("git rev-parse HEAD");
    const date = child_process.execSync("git show -s --format=%ci");
    const git = {
      commit: { hash: commitHash.toString().trim().slice(0, 7), date: date.toString().trim() },
    };
    return git;
  }
  static getConfig() {
    const configText = fs.readFileSync("trovu.config.default.yml", "utf8");
    const config = jsyaml.load(configText);
    // Override with local config if it exists.
    if (fs.existsSync("trovu.config.yml")) {
      const localConfigText = fs.readFileSync("trovu.config.yml", "utf8");
      const localConfig = jsyaml.load(localConfigText);
      Object.assign(config, localConfig);
    }
    return config;
  }
}
