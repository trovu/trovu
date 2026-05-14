import DataManager from ".//DataManager";
import QueryParser from "./QueryParser";
import UrlProcessor from "./UrlProcessor";
import fs from "fs";
import type { RawShortcutObject, ShortcutTestCase, TrovuData } from "../types";

interface ShortcutTesterOptions {
  filter?: string;
  verbose?: boolean;
}

export default class ShortcutTester {
  options: ShortcutTesterOptions;
  env: { data: TrovuData; language: string; country: string };

  constructor(options: ShortcutTesterOptions = {}) {
    this.options = options;
    this.env = {
      data: DataManager.load(),
      language: "en",
      country: "us",
    };
  }

  testShortcuts() {
    for (const namespace in this.env.data.shortcuts || {}) {
      for (const key in this.env.data.shortcuts[namespace]) {
        const rawShortcut = this.env.data.shortcuts[namespace][key];
        const shortcut: RawShortcutObject = typeof rawShortcut === "string" ? { url: rawShortcut } : rawShortcut;
        if (shortcut.tests && Array.isArray(shortcut.tests) && this.filterShortcut(namespace, key)) {
          shortcut.tests.forEach((test: ShortcutTestCase) => {
            const testArguments = typeof test.arguments === "string" ? test.arguments : "";
            const testExpect = typeof test.expect === "string" ? test.expect : "";
            const url = this.prepareUrl(shortcut, testArguments);
            this.fetchAndTestUrl(namespace, key, url, testExpect);
          });
        }
      }
    }
  }

  filterShortcut(namespace: string, key: string) {
    return this.options.filter ? `${namespace}.${key}`.includes(this.options.filter) : true;
  }

  prepareUrl(shortcut: RawShortcutObject, testArguments = "") {
    let url = typeof shortcut.url === "string" ? shortcut.url : "";
    const args = QueryParser.getArguments(testArguments);
    url = UrlProcessor.replaceVariables(url, this.env);
    url = UrlProcessor.replaceArguments(url, args, this.env);
    return url;
  }

  fetchAndTestUrl(namespace: string, key: string, url: string, testExpect = "") {
    if (this.options.verbose) {
      console.log(`${namespace}.${key}\t⏳ ${url}`);
    }
    fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Safari/537.36",
      },
    })
      .then((response) => {
        if (!response.ok) {
          console.log(`${namespace}.${key}\t❌ failed with HTTP error code ${response.status}: ${response.statusText}`);
          return undefined;
        }
        return response.text();
      })
      .then((text) => {
        if (text === undefined) {
          return;
        }
        const regex = new RegExp(testExpect, "m");
        if (regex.test(text)) {
          if (this.options.verbose) {
            console.log(`${namespace}.${key}\t✅ passed`);
          }
        } else {
          console.log(`${namespace}.${key}\t❌ failed to find "${testExpect}"`);
          if (!fs.existsSync("failed-shortcuts")) {
            fs.mkdirSync("failed-shortcuts");
          }
          fs.writeFileSync(`failed-shortcuts/${namespace}.${key}.html`, text, "utf8");
        }
      })
      .catch((error) => console.error(error));
  }
}
