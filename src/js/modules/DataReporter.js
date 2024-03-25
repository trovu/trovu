import DataManager from './/DataManager';
import UrlProcessor from './UrlProcessor';

export default class DataReporter {
  constructor(options) {
    this.options = options;
    this.env = {
      data: DataManager.load(),
      language: 'en',
      country: 'us',
    };
  }

  reportData() {
    const report = {};
    for (const namespace in this.env.data.shortcuts) {
      if (this.options.namespace && this.options.namespace !== namespace) {
        continue;
      }
      DataReporter.increment(report, 'namespaces');
      for (const key in this.env.data.shortcuts[namespace]) {
        DataReporter.increment(report, 'shortcuts');
        const shortcut = this.env.data.shortcuts[namespace][key];
        const args = UrlProcessor.getArgumentsFromString(shortcut.url);
        if (shortcut.tests) {
          if (Array.isArray(shortcut.tests)) {
            DataReporter.increment(report, 'with tests');
          } else {
            DataReporter.increment(report, 'with no-test-excuse');
          }
        }
        if (shortcut.examples) {
          DataReporter.increment(report, 'with examples');
        }
        if (shortcut.deprecated) {
          DataReporter.increment(report, 'deprecated');
        } else if (shortcut.removed) {
          DataReporter.increment(report, 'removed');
        } else {
          DataReporter.increment(report, 'active');
          DataReporter.increment(
            report,
            `with ${Object.keys(args).length} args`,
          );
        }
      }
    }
    DataReporter.calculatePercentage(report, 'with tests', report.active.count);
    for (let i = 0; i < 7; i++) {
      if (report[`with ${i} args`]) {
        DataReporter.calculatePercentage(
          report,
          `with ${i} args`,
          report.active.count,
        );
      }
    }
    DataReporter.calculatePercentage(report, 'with tests', report.active.count);
    DataReporter.calculatePercentage(
      report,
      'with examples',
      report.active.count,
    );
    console.table(report);
  }
  static increment(report, key) {
    if (!report[key]) {
      report[key] = { count: 0 };
    }
    report[key].count++;
  }
  static calculatePercentage(report, key, total) {
    report[key].percent = ((report[key].count / total) * 100).toFixed(2) + '%';
  }

  reportShortcuts(namespace, key) {
    return this.options.filter
      ? `${namespace}.${key}`.includes(this.options.filter)
      : true;
  }
}
