// @ts-nocheck
import DataManager from "./DataManager";

export default class DataReporter {
  constructor(options) {
    this.options = options;
    this.env = {
      data: DataManager.load(),
    };
  }

  reportData() {
    const reportShortcutsByNamespace = {};
    const reportShortcutsByKeywordLength = {};
    const reportShortcutsByArgCount = {};
    const reportShortcutsByProtocol = {};
    const reportShortcutsByProperties = {};
    const reportShortcutsByState = {};
    for (const namespace in this.env.data.shortcuts) {
      if (this.options.namespace && this.options.namespace !== namespace) {
        continue;
      }
      for (const key in this.env.data.shortcuts[namespace]) {
        DataReporter.increment(reportShortcutsByState, "all");
        const shortcut = this.env.data.shortcuts[namespace][key];
        const [keyword, argCount] = key.split(" ");
        if (
          // argCount == 0 &&
          !shortcut.examples &&
          !shortcut.deprecated &&
          !shortcut.removed
        ) {
          console.log("Active shortcut with 0 arguments and no examples:", key);
        }
        if (shortcut.tests) {
          if (Array.isArray(shortcut.tests)) {
            DataReporter.increment(reportShortcutsByProperties, "with tests");
          } else {
            DataReporter.increment(reportShortcutsByProperties, "with test-excuse");
          }
        }
        if (shortcut.examples) {
          DataReporter.increment(reportShortcutsByProperties, "with examples");
        }
        if (shortcut.tags) {
          DataReporter.increment(reportShortcutsByProperties, "with tags");
        }
        if (shortcut.include) {
          DataReporter.increment(reportShortcutsByProperties, "with includes");
        }
        if (shortcut.deprecated) {
          DataReporter.increment(reportShortcutsByState, "deprecated");
        } else if (shortcut.removed) {
          DataReporter.increment(reportShortcutsByState, "removed");
        } else {
          DataReporter.increment(reportShortcutsByArgCount, "active");
          DataReporter.increment(reportShortcutsByKeywordLength, "active");
          DataReporter.increment(reportShortcutsByNamespace, "active");
          DataReporter.increment(reportShortcutsByNamespace, namespace);
          DataReporter.increment(reportShortcutsByProperties, "active");
          DataReporter.increment(reportShortcutsByState, "active");
          DataReporter.increment(reportShortcutsByArgCount, argCount);
          DataReporter.increment(reportShortcutsByKeywordLength, keyword.length);
        }
        if (shortcut.url) {
          DataReporter.increment(reportShortcutsByProtocol, "with url");
          const parts = shortcut.url.split(":");
          const procotol = parts[0];
          DataReporter.increment(reportShortcutsByProtocol, procotol);
        }
      }
    }
    for (const namespace in this.env.data.shortcuts) {
      if (this.options.namespace && this.options.namespace !== namespace) {
        continue;
      }
      DataReporter.calculatePercentage(reportShortcutsByNamespace, namespace, reportShortcutsByNamespace.active.count);
    }
    DataReporter.calculatePercentage(reportShortcutsByArgCount, "active", reportShortcutsByArgCount.active.count);
    ["active", "with tests", "with test-excuse", "with examples", "with tags", "with includes"].forEach((key) => {
      DataReporter.calculatePercentage(reportShortcutsByProperties, key, reportShortcutsByProperties.active.count);
    });
    ["all", "active", "deprecated", "removed"].forEach((key) => {
      DataReporter.calculatePercentage(reportShortcutsByState, key, reportShortcutsByState.all.count);
    });
    ["with url", "http", "https"].forEach((key) => {
      DataReporter.calculatePercentage(reportShortcutsByProtocol, key, reportShortcutsByProtocol["with url"].count);
    });
    for (let i = 0; i < 30; i++) {
      if (reportShortcutsByArgCount[i]) {
        DataReporter.calculatePercentage(reportShortcutsByArgCount, i, reportShortcutsByProperties.active.count);
      }
      if (reportShortcutsByKeywordLength[i]) {
        DataReporter.calculatePercentage(
          reportShortcutsByKeywordLength,
          i,
          reportShortcutsByKeywordLength.active.count,
        );
      }
    }
    console.log("Shortcuts by namespaces:");
    console.table(reportShortcutsByNamespace);
    console.log("Shortcuts by state:");
    console.table(reportShortcutsByState);
    console.log("Shortcuts by arg count:");
    console.table(reportShortcutsByArgCount);
    console.log("Shortcuts by keyword length:");
    console.table(reportShortcutsByKeywordLength);
    console.log("Shortcuts by properties:");
    console.table(reportShortcutsByProperties);
    console.log("Shortcuts by protocol:");
    console.table(reportShortcutsByProtocol);
  }
  static increment(report, key) {
    if (!report[key]) {
      report[key] = { count: 0 };
    }
    report[key].count++;
  }
  static calculatePercentage(report, key, total) {
    if (!report[key]) {
      report[key] = { count: 0 };
    }
    report[key].percent = ((report[key].count / total) * 100).toFixed(2) + "%";
  }
}
