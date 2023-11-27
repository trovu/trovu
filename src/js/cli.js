import { Command } from 'commander';
import DataManager from './modules/DataManager';
import UrlProcessor from './modules/UrlProcessor';
import jsyaml from 'js-yaml';

const program = new Command();

program.name('trovu').description('CLI for trovu.net').version('0.0.1');

program
  .command('compile-data')
  .description('Compile YAML data files to JSON')
  .action(compileData);

program
  .command('normalize-data')
  .description('Normalize YAML data files')
  .action(normalizeData);

program
  .command('migrate-placeholders')
  .description('Migrate custom placeholder format to YAML ')
  .action(migratePlaceholders);

program.parse();

function compileData() {
  const data = DataManager.load();
  const json = JSON.stringify(data);
  process.stdout.write(json);
}

function normalizeData() {
  const data = DataManager.load();
  DataManager.write(data);
}

function migratePlaceholders() {
  const data = DataManager.load();
  for (const namespace in data.shortcuts) {
    for (const key in data.shortcuts[namespace]) {
      const shortcut = data.shortcuts[namespace][key];
      if (shortcut.url) {
        let newUrl = shortcut.url;
        for (const prefix of ['%', '\\$']) {
          const placeholders = UrlProcessor.getPlaceholdersFromStringLegacy(
            shortcut.url,
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
            while (newUrl.includes(match)) {
              newUrl = newUrl.replace(match, newPlaceholderYamlBrackets);
            }
            continue;
            console.log(
              placeholder,
              '\t',
              placeholderName,
              '\t',
              match,
              '\t',
              attributes,
              '\t',
              newPlaceholder,
              '\t',
              newPlaceholderYaml,
              '\t',
              newPlaceholderYamlBrackets,
            );
          }
          shortcut.url = newUrl;
        }
      }
    }
    DataManager.write(data);
  }
}

function isOnlyNumber(str) {
  return Number.isFinite(Number(str));
}
