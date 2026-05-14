import child_process from "child_process";
import fs from "fs";
import jsyaml from "js-yaml";

export default class DataCompiler {
  static getGitInfo() {
    const hash = child_process.execSync("git rev-parse HEAD");
    const date = child_process.execSync("git show -s --format=%ci");
    /** @type {import("../types").GitInfo} */
    const git = {
      commit: { hash: hash.toString().trim().slice(0, 7), date: date.toString().trim() },
    };
    return git;
  }
  static getConfig() {
    const configText = fs.readFileSync("trovu.config.default.yml", "utf8");
    /** @type {import("../types").TrovuConfig} */
    const config = jsyaml.load(configText);
    // Override with local config if it exists.
    if (fs.existsSync("trovu.config.yml")) {
      const localConfigText = fs.readFileSync("trovu.config.yml", "utf8");
      /** @type {Partial<import("../types").TrovuConfig>} */
      const localConfig = jsyaml.load(localConfigText);
      Object.assign(config, localConfig);
    }
    return config;
  }
}
