import DataManager from './/DataManager';
import QueryParser from './QueryParser';
import UrlProcessor from './UrlProcessor';
import fs from 'fs';

export default class ShortcutTester {
  constructor(options) {
    this.options = options;
    this.env = {
      data: DataManager.load(),
      language: 'en',
      country: 'us',
    };
  }

  testShortcuts() {
    for (const namespace in this.env.data.shortcuts) {
      for (const key in this.env.data.shortcuts[namespace]) {
        const shortcut = this.env.data.shortcuts[namespace][key];
        if (
          shortcut.tests &&
          Array.isArray(shortcut.tests) &&
          this.filterShortcut(namespace, key)
        ) {
          shortcut.tests.forEach((test) => {
            const url = this.prepareUrl(shortcut, test.arguments);
            this.fetchAndTestUrl(namespace, key, url, test.expect);
          });
        }
      }
    }
  }

  filterShortcut(namespace, key) {
    return this.options.filter
      ? `${namespace}.${key}`.includes(this.options.filter)
      : true;
  }

  prepareUrl(shortcut, testArguments) {
    let url = shortcut.url;
    const args = QueryParser.getArguments(testArguments);
    url = UrlProcessor.replaceVariables(url, this.env);
    url = UrlProcessor.replaceArguments(url, args, this.env);
    return url;
  }

  fetchAndTestUrl(namespace, key, url, testExpect) {
    console.log(`${namespace}.${key}\t⏳ ${url}`);
    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(JSON.stringify(response));
        return response.text();
      })
      .then((text) => {
        const regex = new RegExp(testExpect, 'm');
        if (regex.test(text)) {
          console.log(`${namespace}.${key}\t✅ passed`);
        } else {
          console.log(`${namespace}.${key}\t❌ failed to find "${testExpect}"`);
          fs.writeFileSync(`${namespace}.${key}.html`, text, 'utf8');
        }
      })
      .catch((error) => console.error(error));
  }
}
