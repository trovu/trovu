import child_process from "child_process";
import fs from "fs";
import jsyaml from "js-yaml";

export default class DataCompiler {
  static getGitInfo() {
    let hashStr = "unknown";
    let dateStr = "unknown";

    try {
      hashStr = child_process.execSync("git rev-parse HEAD").toString().trim();
      dateStr = child_process.execSync("git show -s --format=%ci").toString().trim();
    } catch (e) {
      // Fallback for Vercel's isolated cloud builder environment which lacks .git folders
      hashStr = "pwatest";
      dateStr = new Date().toISOString();
    }

    /** @type {import("../types").GitInfo} */
    const git = {
      commit: { hash: hashStr.slice(0, 7), date: dateStr },
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