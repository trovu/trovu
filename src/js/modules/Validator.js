import DataManager from "./DataManager";
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
    }
    if (hasError) {
      // eslint-disable-next-line no-undef
      process.exit(1);
    }
  }
}
