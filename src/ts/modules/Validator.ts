import DataManager from "./DataManager";
import NamespaceFetcher from "./NamespaceFetcher";
import ShortcutVerifier from "./ShortcutVerifier";
import UrlProcessor from "./UrlProcessor";
import ajv from "ajv";
import fs from "fs";
import jsyaml from "js-yaml";

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
    return jsyaml.load(fs.readFileSync(path, "utf8"));
  }

  validateConfig(validator = this.createValidator(), exitOnError = true) {
    const schema = this.loadSchema("schema/config.yml");
    const config = jsyaml.load(fs.readFileSync("trovu.config.default.yml", "utf8"));
    const hasError = !validator.validate(schema.$id || schema, config);
    if (hasError) {
      console.error(`Problem in trovu.config.default.yml: ${validator.errorsText()}`);
      if (exitOnError) {
        process.exit(1);
      }
    }
    return hasError;
  }

  validateShortcuts(validator = this.createValidator(), exitOnError = true) {
    const schema = this.loadSchema("schema/shortcuts.yml");
    const data: AnyObject = DataManager.load();
    let hasError = false;
    for (const namespace in data.shortcuts) {
      if (!validator.validate(schema.$id || schema, data.shortcuts[namespace])) {
        hasError = true;
        console.error(`Problem in namespace ${namespace}: ${validator.errorsText()}`);
      }
      for (const key in data.shortcuts[namespace]) {
        let shortcut: AnyObject = data.shortcuts[namespace][key];
        if (typeof shortcut === "string") {
          shortcut = { url: shortcut };
        }
        shortcut = NamespaceFetcher.addInfo(shortcut, key, namespace);
        [shortcut.keyword, shortcut.argumentCount] = key.split(" ");
        shortcut.arguments = UrlProcessor.getArgumentsFromString(shortcut.url);
        const verifiers = [
          ShortcutVerifier.checkIfHasUrlAndNoInclude,
          ShortcutVerifier.checkIfArgCountMatches,
          ShortcutVerifier.checkIfArgCountMatchesWithExamples,
          ShortcutVerifier.checkIfDeprecatedAlternativeHasMatchingPlaceholders,
        ];
        for (const verifier of verifiers) {
          const error = verifier(shortcut);
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

  validateData() {
    const validator = this.createValidator();
    const hasConfigError = this.validateConfig(validator, false);
    const hasShortcutError = this.validateShortcuts(validator, false);
    if (hasConfigError || hasShortcutError) {
      process.exit(1);
    }
  }
}
