// @ts-nocheck

/** @module DataManager */
import Logger from "./Logger";
import NamespaceFetcher from "./NamespaceFetcher";
import UrlProcessor from "./UrlProcessor";
import fs from "fs";
import jsyaml from "js-yaml";

export default class DataManager {
  /**
   * Load data from /data.
   * @return {object} data      - The loaded data from /data.
   */
  static load(options = {}) {
    options = this.getDefaultOptions(options);
    const data = {};
    data["shortcuts"] = DataManager.readYmls(`${options.data}/${options.shortcuts}/`, options.filter);
    data["types"] = {};
    data["types"]["city"] = DataManager.readYmls(`${options.data}/${options.types}/city/`);
    data["types"]["date"] = DataManager.readYmls(`${options.data}/${options.types}/date/`);
    return data;
  }

  /**
   * Write data to /data.
   * @param {object} data      - The data to write
   */
  static write(data, options = {}) {
    options = this.getDefaultOptions(options);
    this.normalizeShortcuts(data.shortcuts);
    this.normalizeTags(data.shortcuts);
    this.verifyShortcuts(data.shortcuts);
    DataManager.writeYmls(`${options.data}/${options.shortcuts}/`, data.shortcuts);
    DataManager.writeYmls(`${options.data}/${options.types}/city/`, data.types.city);
    DataManager.writeYmls(`${options.data}/${options.types}/date/`, data.types.date);
  }

  static verifyShortcuts(dataShortcuts) {
    const namespaceFetcher = new NamespaceFetcher({ logger: new Logger() });
    for (const namespace of Object.keys(dataShortcuts)) {
      const shortcuts = dataShortcuts[namespace];
      for (const key in shortcuts) {
        const shortcut = JSON.parse(JSON.stringify(shortcuts[key]));
        [, shortcut.argumentCount] = key.split(" ");
        if (!shortcut.url) continue;
        shortcut.namespace = namespace;
        shortcut.key = key;
        shortcut.arguments = UrlProcessor.getArgumentsFromString(shortcut.url);
        namespaceFetcher.verify(shortcut);
      }
    }
  }

  /**
   * Normalize shortcuts.
   * @param {Object} shortcuts by namespace
   */
  static normalizeShortcuts(shortcuts) {
    for (const namespace in shortcuts) {
      for (const key in shortcuts[namespace]) {
        const shortcut = shortcuts[namespace][key];
        // Sort the keys of the shortcut object in descending order
        const sortedKeys = Object.keys(shortcut).sort((a, b) => b.localeCompare(a));
        const sortedShortcut = {};
        // Create a new object with sorted keys
        for (const sortedKey of sortedKeys) {
          sortedShortcut[sortedKey] = shortcut[sortedKey];
          // if it's a string, trim it.
          if (typeof shortcut[sortedKey] === "string") {
            sortedShortcut[sortedKey] = sortedShortcut[sortedKey].trim();
          }
        }
        // Loop over sortedShortcut.examples and in each object, trim arguments and description
        if (sortedShortcut.examples) {
          for (const example of sortedShortcut.examples) {
            example.description = example.description.trim();
            if (example.arguments && typeof example.arguments === "string") {
              example.arguments = example.arguments.trim();
            }
          }
        }
        shortcuts[namespace][key] = sortedShortcut;
      }
    }
  }

  /**
   * Normalize tags in every shortcut.
   * @param {Object} shortcuts by namespace
   */
  static normalizeTags(shortcuts) {
    for (const namespace in shortcuts) {
      for (const key in shortcuts[namespace]) {
        const shortcut = shortcuts[namespace][key];
        if (shortcut.tags) {
          shortcut.tags.sort();
          // Replace spaces with dashes.
          for (const i in shortcut.tags) {
            shortcut.tags[i] = shortcut.tags[i].replace(/ /g, "-");
          }
        }
      }
    }
  }

  static getDefaultOptions(options) {
    options.data = options.data === undefined ? "./data/" : options.data;
    options.shortcuts = options.shortcuts === undefined ? "shortcuts" : options.shortcuts;
    options.types = options.types === undefined ? "types" : options.types;
    options.filter = options.filter === undefined ? false : options.filter;
    return options;
  }

  /**
   * Read YAML files from a directory.
   * @param   {string} ymlDirPath
   * @returns {object} dataByFileRoot - The data from the YAML files.
   */
  static readYmls(ymlDirPath, filter = false) {
    const dataByFileRoot = {};
    let fileNames = [];
    try {
      fileNames = fs.readdirSync(ymlDirPath);
    } catch (error) {
      if (error.code === "ENOENT") {
        console.log(`Warning: No such directory: ${ymlDirPath}`);
      } else {
        throw error;
      }
    }
    // Filter files by filter.
    if (filter) {
      fileNames = fileNames.filter((fileName) => {
        return fileName.includes(filter);
      });
    }
    for (const fileName of fileNames) {
      const filePath = ymlDirPath + fileName;
      const str = fs.readFileSync(filePath, "utf8");
      const data = jsyaml.load(str);
      const fileRoot = fileName.replace(/\.yml$/, "");
      dataByFileRoot[fileRoot] = data;
    }
    return dataByFileRoot;
  }

  /**
   * Write YAML files to a directory.
   * @param {string} ymlDirPath
   * @param {object} dataByFileRoot - The data to write to YAML files.
   */
  static writeYmls(ymlDirPath, dataByFileRoot) {
    for (const fileRoot in dataByFileRoot) {
      dataByFileRoot[fileRoot] = this.sortObject(dataByFileRoot[fileRoot]);
      const filePath = `${ymlDirPath}/${fileRoot}.yml`;
      const str = jsyaml.dump(dataByFileRoot[fileRoot], {
        noArrayIndent: true,
        lineWidth: -1,
      });
      fs.writeFileSync(filePath, str, "utf8");
    }
  }

  static sortObject(obj) {
    return Object.keys(obj)
      .sort()
      .reduce(function (result, key) {
        result[key] = obj[key];
        return result;
      }, {});
  }
}
