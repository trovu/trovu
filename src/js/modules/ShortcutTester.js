import DataManager from './/DataManager';
import QueryParser from './QueryParser';
import UrlProcessor from './UrlProcessor';

export default class ShortcutTester {
  constructor(options) {
    this.options = options;
    const { data, env } = this.loadDataAndEnv();
    this.data = data;
    this.env = env;
  }

  loadDataAndEnv() {
    const data = DataManager.load();
    const env = {
      data: data,
      language: 'en',
      country: 'us',
    };
    return { data, env };
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
        if (!response.ok)
          throw new Error(`${namespace}.${key}\t❌ failed to fetch ${url}`);
        return response.text();
      })
      .then((text) => {
        if (text.includes(testExpect)) {
          console.log(`${namespace}.${key}\t✅ passed`);
        } else {
          console.log(`${namespace}.${key}\t❌ failed to find "${testExpect}"`);
          // Assuming fs.writeFileSync is available in your environment:
          fs.writeFileSync(`${namespace}.${key}.html`, text, 'utf8');
        }
      })
      .catch((error) => console.error(error));
  }

  testShortcuts() {
    for (const namespace in this.data.shortcuts) {
      for (const key in this.data.shortcuts[namespace]) {
        const shortcut = this.data.shortcuts[namespace][key];
        if (shortcut.tests && this.filterShortcut(namespace, key)) {
          shortcut.tests.forEach((test) => {
            const url = this.prepareUrl(shortcut, test.arguments);
            this.fetchAndTestUrl(namespace, key, url, test.expect);
          });
        }
      }
    }
  }
}
