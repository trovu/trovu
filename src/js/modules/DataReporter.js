import DataManager from './/DataManager';

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
      DataReporter.increment(report, 'namespaces');
      for (const key in this.env.data.shortcuts[namespace]) {
        DataReporter.increment(report, 'shortcuts');
        const shortcut = this.env.data.shortcuts[namespace][key];
        if (shortcut.deprecated) {
          DataReporter.increment(report, 'deprecated');
        } else if (shortcut.removed) {
          DataReporter.increment(report, 'removed');
        } else {
          DataReporter.increment(report, 'active');
        }
        if (shortcut.tests && Array.isArray(shortcut.tests)) {
          DataReporter.increment(report, 'with tests');
        }
        if (shortcut.examples) {
          DataReporter.increment(report, 'with examples');
        }
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
