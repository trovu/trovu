import DataManager from "./DataManager";
import Env from "./Env";
import NamespaceFetcher from "./NamespaceFetcher";
import ShortcutVerifier from "./ShortcutVerifier";
import UrlProcessor from "./UrlProcessor";
import ajv from "ajv";
import fs from "fs";
import jsyaml from "js-yaml";
import type { RawShortcut, RawShortcutInclude, Shortcut, TrovuConfig, TrovuData } from "../types";

export default class Validator {
  createValidator() {
    const validator = new ajv({ strict: true });
    const shortcutsSchema = this.loadSchema("schema/shortcuts.yml");
    const configSchema = this.loadSchema("schema/config.yml");
    validator.addSchema(shortcutsSchema);
    validator.addSchema(configSchema);
    return validator;
  }

  loadSchema(path: string) {
    return jsyaml.load(fs.readFileSync(path, "utf8")) as Record<string, unknown>;
  }

  validateConfig(validator = this.createValidator(), exitOnError = true) {
    const schema = this.loadSchema("schema/config.yml");
    const config = jsyaml.load(fs.readFileSync("trovu.config.default.yml", "utf8")) as TrovuConfig;
    const hasError = !validator.validate(schema.$id || schema, config);
    if (hasError) {
      console.error(`Problem in trovu.config.default.yml: ${validator.errorsText()}`);
      if (exitOnError) {
        process.exit(1);
      }
    }
    return hasError;
  }

  validateShortcuts(validator = this.createValidator(), exitOnError = true, data: TrovuData = DataManager.load()) {
    const schema = this.loadSchema("schema/shortcuts.yml");
    let hasError = false;
    for (const namespace in data.shortcuts) {
      if (!validator.validate(schema.$id || schema, data.shortcuts[namespace])) {
        hasError = true;
        console.error(`Problem in namespace ${namespace}: ${validator.errorsText()}`);
      }
      for (const key in data.shortcuts[namespace]) {
        let shortcut: RawShortcut = data.shortcuts[namespace][key];
        if (typeof shortcut === "string") {
          shortcut = { url: shortcut };
        }
        const normalizedShortcut = NamespaceFetcher.addInfo(shortcut, key, namespace);
        normalizedShortcut.keyword = key.split(" ")[0];
        normalizedShortcut.argumentCount = parseInt(key.split(" ")[1], 10);
        normalizedShortcut.arguments = UrlProcessor.getArgumentsFromString(normalizedShortcut.url || "");
        const verifiers = [
          ShortcutVerifier.checkIfHasUrlAndNoInclude,
          ShortcutVerifier.checkIfArgCountMatches,
          ShortcutVerifier.checkIfArgCountMatchesWithExamples,
          ShortcutVerifier.checkIfDeprecatedAlternativeHasMatchingPlaceholders,
        ];
        for (const verifier of verifiers) {
          const error = verifier(normalizedShortcut);
          if (error) {
            hasError = true;
            console.error(error);
          }
        }
      }
    }
    if (hasError && exitOnError) {
      process.exit(1);
    }
    return hasError;
  }

  validateResolvedNamespaces(exitOnError = true, data: TrovuData = DataManager.load()) {
    let hasError = false;
    const languages = this.getLanguagesForResolvedNamespaceValidation(data);
    for (const language of languages) {
      try {
        this.resolveLocalNamespaces(data, language);
      } catch (error) {
        hasError = true;
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Problem resolving local namespaces for language ${language}: ${message}`);
      }
    }
    if (hasError && exitOnError) {
      process.exit(1);
    }
    return hasError;
  }

  getLanguagesForResolvedNamespaceValidation(data: TrovuData): string[] {
    const languages = new Set(["en"]);
    if (!this.hasLanguageDependentInclude(data)) {
      return Array.from(languages).sort();
    }
    const keyPattern = /^([a-z]{2,3})-([a-z]{2,3}) \d+$/;
    for (const namespace of Object.values(data.shortcuts || {})) {
      for (const key of Object.keys(namespace)) {
        const match = key.match(keyPattern);
        if (!match) {
          continue;
        }
        languages.add(match[1]);
        languages.add(match[2]);
      }
    }
    return Array.from(languages).sort();
  }

  hasLanguageDependentInclude(data: TrovuData): boolean {
    for (const namespace of Object.values(data.shortcuts || {})) {
      for (const shortcut of Object.values(namespace)) {
        const includes = this.getIncludesFromShortcut(shortcut);
        for (const include of includes) {
          const key = typeof include === "string" ? include : include && include.key;
          if (typeof key === "string" && (key.includes("<$language>") || key.includes("{$language}"))) {
            return true;
          }
        }
      }
    }
    return false;
  }

  getIncludesFromShortcut(shortcut: RawShortcut): RawShortcutInclude[] {
    if (typeof shortcut === "string" || !shortcut.include) {
      return [];
    }
    return Array.isArray(shortcut.include) ? shortcut.include : [shortcut.include];
  }

  resolveLocalNamespaces(data: TrovuData, language: string, country = "us") {
    const dataClone = JSON.parse(JSON.stringify(data));
    const env = new Env({
      data: dataClone,
      language,
      country,
    });
    const namespaceFetcher = new NamespaceFetcher(env);
    let namespaceInfos = namespaceFetcher.assignShortcutsFromData({});
    namespaceInfos = namespaceFetcher.addNamespaceInfos(namespaceInfos);
    namespaceFetcher.namespaceInfos = namespaceInfos;
    namespaceInfos = namespaceFetcher.processShortcutsAll(namespaceInfos);
    namespaceInfos = namespaceFetcher.processIncludeAll(namespaceInfos);
    namespaceInfos = namespaceFetcher.addReachable(namespaceInfos);
    namespaceInfos = namespaceFetcher.addInfoAll(namespaceInfos);
    namespaceFetcher.verifyAll(namespaceInfos);
    return namespaceInfos;
  }

  validateData() {
    const validator = this.createValidator();
    const data = DataManager.load();
    const hasConfigError = this.validateConfig(validator, false);
    const hasShortcutError = this.validateShortcuts(validator, false, data);
    const hasResolvedNamespaceError = this.validateResolvedNamespaces(false, data);
    if (hasConfigError || hasShortcutError || hasResolvedNamespaceError) {
      process.exit(1);
    }
  }
}
