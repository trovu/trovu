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
      const url = shortcut.url;
      if (url) {
        let newUrl = url;
        const placeholders = UrlProcessor.getPlaceholdersFromString(url, '%');
        if (placeholders) {
          for (const placeholderName in placeholders) {
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
                // noArrayIndent: true,
                // lineWidth: -1,
                // noCompatMode: true,
                // condenseFlow: true,
              })
              .trim();
            const newPlaceholderYamlBrackets = `<${newPlaceholderYaml}>`;
            newUrl = newUrl.replace(match, newPlaceholderYamlBrackets);
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
