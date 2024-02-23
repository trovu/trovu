import DataManager from './modules/DataManager';
import QueryParser from './modules/QueryParser';
import UrlProcessor from './modules/UrlProcessor';
import ajv from 'ajv';
import { Command } from 'commander';
import fs from 'fs';
import jsyaml from 'js-yaml';

const program = new Command();

program.name('trovu').description('CLI for trovu.net').version('0.0.1');

program
  .command('validate-data')
  .description('Validate YAML data against schema')
  .action(validateData);

program
  .command('compile-data')
  .description('Compile YAML data files to JSON')
  .requiredOption('-o, --output <path>', 'path to output file')
  .action(compileData);

program
  .command('normalize-data')
  .description('Normalize YAML data files')
  .action(normalizeData);

program
  .command('test-shortcuts')
  .description('Test shortcut URLs')
  .option(
    '-f, --filter <string>',
    'only apply to shortcuts containing <string>',
  )
  .action(testShortcuts);

// Call for user data:
// node -r esm src/js/cli.js migrate-placeholders -d /Users/jrg/dta/int/cde/web/tro/trovu-data-user/ -s '' -f shortcuts
program
  .command('migrate-placeholders')
  .description('Migrate custom placeholder format to YAML ')
  .option('-d, --data <path>', 'path to data directory')
  .option('-s, --shortcuts <subpath>', 'subpath to shortcuts directory')
  .option('-t, --types <subpath>', 'subpath to types directory')
  .option('-f, --filter <string>', 'only apply to files containing <string>')
  .action(migratePlaceholders);

program
  .command('migrate-examples')
  .description('Migrate examples to new format')
  .option('-d, --data <path>', 'path to data directory')
  .option('-s, --shortcuts <subpath>', 'subpath to shortcuts directory')
  .option('-t, --types <subpath>', 'subpath to types directory')
  .option('-f, --filter <string>', 'only apply to files containing <string>')
  .action(migrateExamples);

program.parse();

function validateData() {
  const validator = new ajv({ strict: true });
  const schema = jsyaml.load(fs.readFileSync('data/schema/shortcuts.yml'));
  const data = DataManager.load();
  let hasError = false;
  for (const namespace in data.shortcuts) {
    if (!validator.validate(schema, data.shortcuts[namespace])) {
      hasError = true;
      console.error(
        `Problem in namespace ${namespace}: ${validator.errorsText()}`,
      );
    }
  }
  if (hasError) {
    // eslint-disable-next-line no-undef
    process.exit(1);
  }
}

function compileData(options) {
  const data = DataManager.load();
  const json = JSON.stringify(data);
  fs.writeFileSync(options.output, json, 'utf8');
}

function normalizeData() {
  const data = DataManager.load();
  DataManager.write(data);
}

function testShortcuts(options) {
  const data = DataManager.load();

  const env = {
    data: data,
    language: 'en',
    country: 'us',
  };
  for (const namespace in data.shortcuts) {
    for (const key in data.shortcuts[namespace]) {
      const shortcut = data.shortcuts[namespace][key];
      if (shortcut.tests) {
        if (options.filter) {
          if (!`${namespace}.${key}`.includes(options.filter)) continue;
        }
        for (const test of shortcut.tests) {
          const args = QueryParser.getArguments(test.arguments);
          let url = shortcut.url;
          url = UrlProcessor.replaceVariables(url, env);
          url = UrlProcessor.replaceArguments(url, args, env);
          console.log(`${namespace}.${key}\t⏳ ${url}`);
          fetch(url)
            .then((response) => {
              if (!response.ok)
                throw new Error(
                  `${namespace}.${key}\t❌ failed to fetch ${url}`,
                );
              return response.text();
            })
            .then((text) => {
              // keep for debugging
              // console.log(text);
              if (text.includes(test.expect)) {
                console.log(`${namespace}.${key}\t✅ passed`);
              } else {
                console.log(
                  `${namespace}.${key}\t❌ failed to find "${test.expect}", write contents to file ${namespace}.${key}.html`,
                );
                fs.writeFileSync(`${namespace}.${key}.html`, text, 'utf8');
              }
            })
            .catch((error) => console.error(error));
        }
      }
    }
  }
}

function migratePlaceholders(options) {
  const dataPath = options.data;
  const shortcutsPath = options.shortcuts;
  const typesPath = options.types;
  const filter = options.filter;
  const data = DataManager.load(dataPath, shortcutsPath, typesPath, filter);
  for (const namespace in data.shortcuts) {
    for (const key in data.shortcuts[namespace]) {
      let shortcut = data.shortcuts[namespace][key];
      // if shortcut typeoff string, convert to object
      if (typeof shortcut === 'string') {
        shortcut = replacePlaceholders(shortcut, namespace, key);
      }
      if (shortcut.url) {
        shortcut.url = replacePlaceholders(shortcut.url, namespace, key);
      }
      if (
        shortcut.deprecated &&
        shortcut.deprecated.alternative &&
        shortcut.deprecated.alternative.query
      ) {
        shortcut.deprecated.alternative.query =
          shortcut.deprecated.alternative.query.replace(/\{%(\d)\}/g, '<$1>');
      }
      if (shortcut.include && shortcut.include.key) {
        shortcut.include.key = replacePlaceholders(
          shortcut.include.key,
          namespace,
          key,
        );
      }
      data.shortcuts[namespace][key] = shortcut;
    }
    DataManager.write(data, dataPath, shortcutsPath, typesPath);
  }
}

function replacePlaceholders(str, namespace, key) {
  for (const prefix of ['%', '\\$']) {
    const placeholders = UrlProcessor.getPlaceholdersFromStringLegacy(
      str,
      prefix,
    );
    for (const placeholderName in placeholders) {
      if (isOnlyNumber(placeholderName)) {
        console.log(
          `Warning: In shortcut ${namespace}.${key}, placeholder name ${placeholderName} is only a number.`,
        );
      }
      let newPlaceholder;
      const placeholder = placeholders[placeholderName];
      const match = Object.keys(placeholder)[0];
      const attributes = Object.values(placeholder)[0];
      if (Object.keys(attributes).length === 0) {
        newPlaceholder = placeholderName;
      } else {
        newPlaceholder = {};
        newPlaceholder[placeholderName] = attributes;
      }
      const newPlaceholderYaml = jsyaml
        .dump(newPlaceholder, {
          flowLevel: 1,
        })
        .trim();
      let newPlaceholderYamlBrackets = '<';
      switch (prefix) {
        case '%':
          break;
        case '\\$':
          newPlaceholderYamlBrackets += '$';
          break;
      }
      newPlaceholderYamlBrackets += `${newPlaceholderYaml}>`;
      while (str.includes(match)) {
        str = str.replace(match, newPlaceholderYamlBrackets);
      }
    }
  }
  return str;
}

function isOnlyNumber(str) {
  return Number.isFinite(Number(str));
}

function migrateExamples(options) {
  const data = DataManager.load(options);
  for (const namespace in data.shortcuts) {
    for (const key in data.shortcuts[namespace]) {
      let shortcut = data.shortcuts[namespace][key];
      // Normalize examples.
      if (shortcut.examples && !Array.isArray(shortcut.examples)) {
        const examples = [];
        for (const [argumentString, description] of Object.entries(
          shortcut.examples,
        )) {
          const example = {
            arguments: argumentString,
            description: description,
          };
          examples.push(example);
        }
        shortcut.examples = examples;
      }
      data.shortcuts[namespace][key] = shortcut;
    }
    DataManager.write(data, options);
  }
}
