/** @module DataManager */
import Logger from "./Logger";
import NamespaceFetcher from "./NamespaceFetcher";
import UrlProcessor from "./UrlProcessor";
import fs from "fs";
import jsyaml from "js-yaml";
import type { Dict, RawShortcutMap, Shortcut, TrovuData } from "../types";

interface DataManagerOptions {
  data?: string;
  shortcuts?: string;
  types?: string;
  filter?: string | false;
}

export default class DataManager {
  /**
   * Load data from /data.
   * @return {object} data      - The loaded data from /data.
   */
  static load(options: DataManagerOptions = {}): TrovuData {
    options = this.getDefaultOptions(options);
    const data = {} as TrovuData;
    data.shortcuts = DataManager.readYmls(`${options.data}/${options.shortcuts}/`, options.filter) as TrovuData["shortcuts"];
    data.types = {
      city: DataManager.readYmls(`${options.data}/${options.types}/city/`) as TrovuData["types"]["city"],
      date: DataManager.readYmls(`${options.data}/${options.types}/date/`) as TrovuData["types"]["date"],
    };
    return data;
  }

  /**
   * Write data to /data.
   * @param {object} data      - The data to write
   */
  static write(data: TrovuData, options: DataManagerOptions = {}) {
    options = this.getDefaultOptions(options);
    const shortcuts = data.shortcuts || {};
    const city = data.types?.city || {};
    const date = data.types?.date || {};
    this.normalizeShortcuts(shortcuts);
    this.normalizeTags(shortcuts);
    this.verifyShortcuts(shortcuts);
    DataManager.writeYmls(`${options.data}/${options.shortcuts}/`, shortcuts, "shortcuts");
    DataManager.writeYmls(`${options.data}/${options.types}/city/`, city);
    DataManager.writeYmls(`${options.data}/${options.types}/date/`, date);
  }

  static verifyShortcuts(dataShortcuts: TrovuData["shortcuts"] = {}) {
    const namespaceFetcher = new NamespaceFetcher({ logger: new Logger() });
    for (const namespace of Object.keys(dataShortcuts)) {
      const shortcuts = dataShortcuts[namespace];
      for (const key in shortcuts) {
        const shortcut = JSON.parse(JSON.stringify(shortcuts[key])) as Shortcut;
        shortcut.argumentCount = parseInt(key.split(" ")[1], 10);
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
  static normalizeShortcuts(shortcuts: TrovuData["shortcuts"] = {}) {
    for (const namespace in shortcuts) {
      for (const key in shortcuts[namespace]) {
        const shortcut = shortcuts[namespace][key];
        if (typeof shortcut === "string") {
          shortcuts[namespace][key] = shortcut.trim();
          continue;
        }
        // Sort the keys of the shortcut object in descending order
        const sortedKeys = Object.keys(shortcut).sort((a, b) => b.localeCompare(a));
        const sortedShortcut: Shortcut = {};
        // Create a new object with sorted keys
        for (const sortedKey of sortedKeys) {
          sortedShortcut[sortedKey] = shortcut[sortedKey];
          // if it's a string, trim it.
          if (typeof shortcut[sortedKey] === "string") {
            sortedShortcut[sortedKey] = (sortedShortcut[sortedKey] as string).trim();
          }
        }
        // Loop over sortedShortcut.examples and in each object, trim arguments and description
        if (sortedShortcut.examples) {
          for (const example of sortedShortcut.examples) {
            if (example.description) {
              example.description = example.description.trim();
            }
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
  static normalizeTags(shortcuts: TrovuData["shortcuts"] = {}) {
    for (const namespace in shortcuts) {
      for (const key in shortcuts[namespace]) {
        const shortcut = shortcuts[namespace][key];
        if (typeof shortcut !== "string" && Array.isArray(shortcut.tags)) {
          shortcut.tags.sort();
          // Replace spaces with dashes.
          for (const i in shortcut.tags) {
            shortcut.tags[i] = shortcut.tags[i].replace(/ /g, "-");
          }
        }
      }
    }
  }

  static getDefaultOptions(options: DataManagerOptions): Required<DataManagerOptions> {
    return {
      data: options.data === undefined ? "./data/" : options.data,
      shortcuts: options.shortcuts === undefined ? "shortcuts" : options.shortcuts,
      types: options.types === undefined ? "types" : options.types,
      filter: options.filter === undefined ? false : options.filter,
    };
  }

  /**
   * Read YAML files from a directory.
   * @param   {string} ymlDirPath
   * @returns {object} dataByFileRoot - The data from the YAML files.
   */
  static readYmls(ymlDirPath: string, filter: string | false = false): Dict<unknown> {
    const dataByFileRoot: Dict<unknown> = {};
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
  static writeYmls(ymlDirPath: string, dataByFileRoot: Dict<unknown>, schemaName?: string) {
    const schemaHeader = schemaName
      ? `# yaml-language-server: $schema=https://trovu.net/schema/${schemaName}.yml\n`
      : "";

    for (const fileRoot in dataByFileRoot) {
      dataByFileRoot[fileRoot] = this.sortObject(dataByFileRoot[fileRoot]);
      const filePath = `${ymlDirPath}/${fileRoot}.yml`;

      const yamlContent = jsyaml.dump(dataByFileRoot[fileRoot], {
        noArrayIndent: true,
        lineWidth: -1,
      });

      fs.writeFileSync(filePath, schemaHeader + yamlContent, "utf8");
    }
  }

  static sortObject<T>(obj: T): T {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
      return obj;
    }
    return Object.keys(obj)
      .sort()
      .reduce(function (result, key) {
        result[key] = obj[key];
        return result;
      }, {} as Record<string, unknown>) as T;
  }
}
