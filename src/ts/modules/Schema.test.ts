import Ajv from "ajv";
import fs from "fs";
import jsyaml from "js-yaml";

describe("published YAML schemas", () => {
  function createValidator() {
    const validator = new Ajv({ strict: true });
    const shortcutsSchema = jsyaml.load(fs.readFileSync("schema/shortcuts.yml", "utf8"));
    const configSchema = jsyaml.load(fs.readFileSync("schema/config.yml", "utf8"));
    validator.addSchema(shortcutsSchema);
    validator.addSchema(configSchema);
    return {
      validator,
      shortcutsSchema,
      configSchema,
    };
  }

  test("shortcuts schema accepts short notation and example queries", () => {
    const { validator, shortcutsSchema } = createValidator();
    const shortcuts = {
      "examplekeyword 0": "https://www.example.com/",
      "frw 1": {
        url: "https://fr.wikipedia.org/wiki/<query>",
        examples: [
          {
            query: "fr.w berlin",
            description: "Search French Wikipedia for Berlin",
          },
        ],
      },
    };

    expect(validator.validate(shortcutsSchema, shortcuts)).toBe(true);
  });

  test("config schema accepts github, url and inline shortcuts namespaces", () => {
    const { validator, configSchema } = createValidator();
    const config = {
      namespaces: [
        "o",
        "<$language>",
        ".<$country>",
        {
          github: ".",
          name: "my",
        },
        {
          name: "mydomain",
          url: "https://example.com/shortcuts.yml",
        },
        {
          name: "inline",
          shortcuts: {
            "examplekeyword 0": {
              url: "https://www.example.com/",
              examples: [
                {
                  description: "Go to the homepage",
                },
              ],
            },
          },
        },
      ],
      defaultKeyword: "g",
      language: "en",
      country: "us",
    };

    expect(validator.validate(configSchema, config)).toBe(true);
  });
});
