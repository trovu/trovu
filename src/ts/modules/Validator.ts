// @ts-nocheck
import DataManager from "./DataManager";
import NamespaceFetcher from "./NamespaceFetcher";
import ShortcutVerifier from "./ShortcutVerifier";
import UrlProcessor from "./UrlProcessor";
import ajv from "ajv";
import fs from "fs";
import jsyaml from "js-yaml";

export default class Validator {
  validateShortcuts() {
    const validator = new ajv({ strict: true });
    const schema = jsyaml.load(fs.readFileSync("data/schema/shortcuts.yml"));
    const data = DataManager.load();
    let hasError = false;
    for (const namespace in data.shortcuts) {
      if (!validator.validate(schema, data.shortcuts[namespace])) {
        hasError = true;
        console.error(`Problem in namespace ${namespace}: ${validator.errorsText()}`);
      }
      for (const key in data.shortcuts[namespace]) {
        let shortcut = data.shortcuts[namespace][key];
        shortcut = NamespaceFetcher.addInfo(shortcut, key, namespace);
        [shortcut.keyword, shortcut.argumentCount] = key.split(" ");
        shortcut.arguments = UrlProcessor.getArgumentsFromString(shortcut.url);
        const error = ShortcutVerifier.checkIfHasUrlAndNoInclude(shortcut);
        if (error) {
          hasError = true;
          console.error(error);
        }
        const error2 = ShortcutVerifier.checkIfArgCountMatches(shortcut);
        if (error2) {
          hasError = true;
          console.error(error2);
        }
      }
    }
    if (hasError) {
      // eslint-disable-next-line no-undef
      process.exit(1);
    }
  }
}
