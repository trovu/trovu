import DataManager from "./DataManager";
import UrlProcessor from "./UrlProcessor";
import fs from "fs";
import jsyaml from "js-yaml";

// import { type } from 'os';

export default class Migrator {
  constructor() {}

  async migrateProtocol(options: AnyObject) {
    const dataPath = options.data;
    const shortcutsPath = options.shortcuts;
    const typesPath = options.types;
    const data: AnyObject = DataManager.load(options);
    for (const namespace in data.shortcuts) {
      for (const key in data.shortcuts[namespace]) {
        // const [keyword, argCount] = key.split(' ');
        if (key[0] != "z") {
          continue;
        }
        const args = ["arg1", "arg2", "arg3", "arg4", "arg5", "arg6", "arg7", "arg8", "arg9", "arg10"];
        let shortcut: AnyObject = data.shortcuts[namespace][key];
        // If the URL starts with http, fetch its contents, migrate to https, fetch again, and compare results
        if (shortcut.url && shortcut.url.startsWith("http:")) {
          console.log(`${namespace}.${key}`);
          const httpUrl = shortcut.url;
          let processedHttpUrl = shortcut.url;
          processedHttpUrl = UrlProcessor.replaceVariables(processedHttpUrl, {
            language: "en",
            country: "us",
          });
          processedHttpUrl = UrlProcessor.replaceArguments(processedHttpUrl, args, {
            language: "en",
            country: "us",
            data: { types: { city: {} } },
          });
          // console.log(originalUrl);
          const processedHttpsUrl = processedHttpUrl.replace("http:", "https:");
          console.log("  🔵 ", processedHttpUrl);
          console.log("  🟨 ", processedHttpsUrl);
          const domain = processedHttpUrl.split("/")[2];
          console.log("  🔺 ", domain);
          shortcut.url = httpUrl.replace("http:", "https:");
          if (typeof key === "string") {
            continue;
          }

          // First check if the http URL redirects to the https URL.
          try {
            const httpResponse = await fetch(processedHttpUrl);
            if (httpResponse.redirected && httpResponse.url == processedHttpsUrl) {
              shortcut.url = httpUrl.replace("http:", "https:");
              console.log("==", key);
              continue;
            } else {
              console.log("!=");
              console.log(httpResponse.url);
              console.log(processedHttpsUrl);
            }
            console.log(httpResponse.redirected, httpResponse.url);
          } catch (error) {
            console.error(`Error migrating ${key}:`, error);
          }

          try {
            const httpResponse = await fetch(processedHttpUrl);
            const httpText = await httpResponse.text();
            // console.log('originalText', originalText);
            const httpsResponse = await fetch(processedHttpsUrl);
            const httpsText = await httpsResponse.text();
            // console.log('httpsText', httpsText);

            if (httpsText === httpText) {
              console.log("==", key);
              shortcut.url = httpUrl.replace("http:", "https:");
            } else {
              console.log("!=", key);
              // write both to files out.key.http and out.key.https
              const outPath = `out.${key}`;
              const outHttpPath = `${outPath}.http`;
              const outHttpsPath = `${outPath}.https`;
              console.log("Writing", outHttpPath);
              console.log("Writing", outHttpsPath);
              fs.writeFileSync(outHttpPath, httpText, "utf8");
              fs.writeFileSync(outHttpsPath, httpsText, "utf8");
            }
          } catch (error) {
            console.error(`Error migrating ${key}:`, error);
          }
        }
      }
      DataManager.write(data, { data: dataPath, shortcuts: shortcutsPath, types: typesPath });
    }
  }

  migratePlaceholders(options: AnyObject) {
    const dataPath = options.data;
    const shortcutsPath = options.shortcuts;
    const typesPath = options.types;
    const filter = options.filter;
    const data: any = DataManager.load({
      data: dataPath,
      shortcuts: shortcutsPath,
      types: typesPath,
      filter,
    });
    for (const namespace in data.shortcuts) {
      for (const key in data.shortcuts[namespace]) {
        let shortcut: AnyObject = data.shortcuts[namespace][key];
        // if shortcut typeoff string, convert to object
        if (typeof shortcut === "string") {
          shortcut = { url: this.replacePlaceholders(shortcut, namespace, key) };
        }
        if (shortcut.url) {
          shortcut.url = this.replacePlaceholders(shortcut.url, namespace, key);
        }
        if (shortcut.deprecated && shortcut.deprecated.alternative && shortcut.deprecated.alternative.query) {
          shortcut.deprecated.alternative.query = shortcut.deprecated.alternative.query.replace(/\{%(\d)\}/g, "<$1>");
        }
        if (shortcut.include && shortcut.include.key) {
          shortcut.include.key = this.replacePlaceholders(shortcut.include.key, namespace, key);
        }
        data.shortcuts[namespace][key] = shortcut;
      }
      DataManager.write(data, { data: dataPath, shortcuts: shortcutsPath, types: typesPath });
    }
  }

  replacePlaceholders(str: string, namespace: string, key: string) {
    for (const prefix of ["%", "\\$"]) {
      const placeholders = UrlProcessor.getPlaceholdersFromStringLegacy(str, prefix);
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
          newPlaceholder = {} as AnyObject;
          newPlaceholder[placeholderName] = attributes;
        }
        const newPlaceholderYaml = jsyaml
          .dump(newPlaceholder, {
            flowLevel: 1,
          })
          .trim();
        let newPlaceholderYamlBrackets = "<";
        switch (prefix) {
          case "%":
            break;
          case "\\$":
            newPlaceholderYamlBrackets += "$";
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

  isOnlyNumber(str: string) {
    return Number.isFinite(Number(str));
  }

  migrateExamples(options: AnyObject) {
    const data: AnyObject = DataManager.load(options);
    for (const namespace in data.shortcuts) {
      for (const key in data.shortcuts[namespace]) {
        let shortcut: AnyObject = data.shortcuts[namespace][key];
        // Normalize examples.
        if (shortcut.examples && !Array.isArray(shortcut.examples)) {
          const examples: AnyObject[] = [];
          for (const [argumentString, description] of Object.entries(shortcut.examples)) {
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

  migrateInclude() {
    const data: AnyObject = DataManager.load();
    for (const namespace in data.shortcuts) {
      for (const key in data.shortcuts[namespace]) {
        let shortcut: AnyObject = data.shortcuts[namespace][key];
        if (shortcut.include && shortcut.include.key && !shortcut.include.namespace) {
          shortcut.include = shortcut.include.key;
        }
      }
      DataManager.write(data);
    }
  }
}
