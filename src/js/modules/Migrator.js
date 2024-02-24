import DataManager from './DataManager';
import UrlProcessor from './UrlProcessor';

export default class Migrator {
  constructor() {}

  migratePlaceholders(options) {
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
          shortcut = this.replacePlaceholders(shortcut, namespace, key);
        }
        if (shortcut.url) {
          shortcut.url = this.replacePlaceholders(shortcut.url, namespace, key);
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
          shortcut.include.key = this.replacePlaceholders(
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

  replacePlaceholders(str, namespace, key) {
    for (const prefix of ['%', '\\$']) {
      const placeholders = UrlProcessor.getPlaceholdersFromStringLegacy(
        str,
        prefix,
      );
      for (const placeholderName in placeholders) {
        if (this.isOnlyNumber(placeholderName)) {
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

  isOnlyNumber(str) {
    return Number.isFinite(Number(str));
  }

  migrateExamples(options) {
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
}
