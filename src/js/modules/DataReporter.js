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
    const reportNamespaces = {};
    const reportShortcutsbyArgCount = {};
    const reportShortcutsbyProperties = {};
    const reportShortcutsbyState = {};
    for (const namespace in this.env.data.shortcuts) {
      if (this.options.namespace && this.options.namespace !== namespace) {
        continue;
      }
      DataReporter.increment(reportNamespaces, 'namespaces');
      for (const key in this.env.data.shortcuts[namespace]) {
        DataReporter.increment(reportShortcutsbyState, 'all');
        const shortcut = this.env.data.shortcuts[namespace][key];
        const args = UrlProcessor.getArgumentsFromString(shortcut.url);
        if (shortcut.tests) {
          if (Array.isArray(shortcut.tests)) {
            DataReporter.increment(reportShortcutsbyProperties, 'with tests');
          } else {
            DataReporter.increment(
              reportShortcutsbyProperties,
              'with test-excuse',
            );
          }
        }
        if (shortcut.examples) {
          DataReporter.increment(reportShortcutsbyProperties, 'with examples');
        }
        if (shortcut.deprecated) {
          DataReporter.increment(reportShortcutsbyState, 'deprecated');
        } else if (shortcut.removed) {
          DataReporter.increment(reportShortcutsbyState, 'removed');
        } else {
          DataReporter.increment(reportShortcutsbyArgCount, 'active');
          DataReporter.increment(reportShortcutsbyProperties, 'active');
          DataReporter.increment(reportShortcutsbyState, 'active');
          DataReporter.increment(
            reportShortcutsbyArgCount,
            `with ${Object.keys(args).length} args`,
          );
        }
      }
    }
    DataReporter.calculatePercentage(
      reportShortcutsbyArgCount,
      'active',
      reportShortcutsbyArgCount.active.count,
    );
    ['active', 'with tests', 'with test-excuse', 'with examples'].forEach(
      (key) => {
        DataReporter.calculatePercentage(
          reportShortcutsbyProperties,
          key,
          reportShortcutsbyProperties.active.count,
        );
      },
    );
    ['all', 'active', 'deprecated', 'removed'].forEach((key) => {
      DataReporter.calculatePercentage(
        reportShortcutsbyState,
        key,
        reportShortcutsbyState.all.count,
      );
    });
    for (let i = 0; i < 7; i++) {
      if (reportShortcutsbyArgCount[`with ${i} args`]) {
        DataReporter.calculatePercentage(
          reportShortcutsbyArgCount,
          `with ${i} args`,
          reportShortcutsbyProperties.active.count,
        );
      }
    }
    console.log('Shortcuts by state:');
    console.table(reportShortcutsbyState);
    console.log('Shortcuts by arg count:');
    console.table(reportShortcutsbyArgCount);
    console.log('Shortcuts by properties:');
    console.table(reportShortcutsbyProperties);
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
