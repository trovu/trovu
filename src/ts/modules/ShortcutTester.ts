// @ts-nocheck
import DataManager from ".//DataManager";
import QueryParser from "./QueryParser";
import UrlProcessor from "./UrlProcessor";
import fs from "fs";

export default class ShortcutTester {
  constructor(options) {
    this.options = options;
    this.env = {
      data: DataManager.load(),
      language: "en",
      country: "us",
    };
  }

  public async testShortcuts() {
    for (const namespace in this.env.data.shortcuts) {
      for (const key in this.env.data.shortcuts[namespace]) {
        if (!this.filterShortcut(namespace, key)) {
          continue;
        }
        const shortcut = this.env.data.shortcuts[namespace][key];
        if (shortcut.tests && Array.isArray(shortcut.tests)) {
          shortcut.tests.forEach((test) => {
            const url = this.prepareUrl(shortcut, test.arguments);
            this.fetchAndTestUrl(namespace, key, url, test.expect);
          });
        } else if (this.options.examples && shortcut.examples && Array.isArray(shortcut.examples)) {
          shortcut.examples.forEach((example) => {
            const url = this.prepareUrl(shortcut, example.arguments);
            this.fetchAndTestUrl(namespace, key, url, '.');
          });
        }
        // TODO: throttling should be based on the number of currently active concurrent requests instead of a fixed pause.
        // Best would be to additionally throttle the requests per destination server to prevent "too many request" responses.
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    }
  }

  private filterShortcut(namespace, key) {
    return this.options.filter ? `${namespace}.${key}`.includes(this.options.filter) : true;
  }

  private prepareUrl(shortcut, testArguments) {
    // TODO: Some arguments (like for .de.dhl 1 or .de.gls 1) are defined as numbers instead of strings in the YAML files. This seems actually to be a data problem?
    let testArgumentsString = typeof testArguments === 'number' ? testArguments.toString() : testArguments;
    let url = shortcut.url;
    const args = QueryParser.getArguments(testArgumentsString);
    url = UrlProcessor.replaceVariables(url, this.env);
    url = UrlProcessor.replaceArguments(url, args, this.env);
    return url;
  }

  private fetchAndTestUrl(namespace, key, url, testExpect) {
    if (this.options.verbose) {
      console.log(`${namespace}.${key}\t⏳ ${url}`);
    }
    const printError = (message) => {
      console.log(`${namespace}.${key}\t❌ ${message} - ${url}`);
    };
    fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Safari/537.36",
      },
    })
      .then((response) => {
        if (!response.ok) {
          printError(`failed with HTTP error code ${response.status}: ${response.statusText}`);
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
          printError(`failed to find "${testExpect}"`);
          if (!fs.existsSync("failed-shortcuts")) {
            fs.mkdirSync("failed-shortcuts");
          }
          fs.writeFileSync(`failed-shortcuts/${namespace}.${key}.html`, text, "utf8");
        }
      })
      .catch((error) => {
        switch (error.cause.code) {
          case 'UND_ERR_CONNECT_TIMEOUT':
            printError('failed to connect to server');
            break;
          case 'ECONNRESET':
            printError('connection was reset');
            break;
          case 'UND_ERR_SOCKET':
            printError('SocketError: other side closed');
          case 'ENOTFOUND':
            printError(`hostname (${error.cause.hostname}) not found`);
            break;
          case 'CERT_HAS_EXPIRED':
            printError('TLS: certificate has expired');
            break;
          case 'ERR_TLS_CERT_ALTNAME_INVALID':
            printError('TLS: certificate uses an invalid altname');
            break;
          case 'UNABLE_TO_VERIFY_LEAF_SIGNATURE':
            printError('TLS: unable to verify the first certificate');
          case 'ERR_INVALID_URL':
            printError('an invalid url was generated');
            break;
          default:
            console.error(error);
            break;
        }
      });
  }
}
