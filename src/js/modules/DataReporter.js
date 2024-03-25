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
    const reportShortcutsByNamespace = {};
    const reportShortcutsByArgCount = {};
    const reportShortcutsByProperties = {};
    const reportShortcutsByState = {};
    for (const namespace in this.env.data.shortcuts) {
      if (this.options.namespace && this.options.namespace !== namespace) {
        continue;
      }
      // reportShortcutsByNamespace[namespace] = {
      //   count: Object.keys(this.env.data.shortcuts[namespace]).length,
      // };
      for (const key in this.env.data.shortcuts[namespace]) {
        DataReporter.increment(reportShortcutsByState, 'all');
        const shortcut = this.env.data.shortcuts[namespace][key];
        const args = UrlProcessor.getArgumentsFromString(shortcut.url);
        if (shortcut.tests) {
          if (Array.isArray(shortcut.tests)) {
            DataReporter.increment(reportShortcutsByProperties, 'with tests');
          } else {
            DataReporter.increment(
              reportShortcutsByProperties,
              'with test-excuse',
            );
          }
        }
        if (shortcut.examples) {
          DataReporter.increment(reportShortcutsByProperties, 'with examples');
        }
        if (shortcut.tags) {
          DataReporter.increment(reportShortcutsByProperties, 'with tags');
        }
        if (shortcut.include) {
          DataReporter.increment(reportShortcutsByProperties, 'with includes');
        }
        if (shortcut.deprecated) {
          DataReporter.increment(reportShortcutsByState, 'deprecated');
        } else if (shortcut.removed) {
          DataReporter.increment(reportShortcutsByState, 'removed');
        } else {
          DataReporter.increment(reportShortcutsByArgCount, 'active');
          DataReporter.increment(reportShortcutsByNamespace, 'active');
          DataReporter.increment(reportShortcutsByNamespace, namespace);
          DataReporter.increment(reportShortcutsByProperties, 'active');
          DataReporter.increment(reportShortcutsByState, 'active');
          DataReporter.increment(
            reportShortcutsByArgCount,
            `with ${Object.keys(args).length} args`,
          );
        }
      }
    }
    for (const namespace in this.env.data.shortcuts) {
      if (this.options.namespace && this.options.namespace !== namespace) {
        continue;
      }
      DataReporter.calculatePercentage(
        reportShortcutsByNamespace,
        namespace,
        reportShortcutsByNamespace.active.count,
      );
    }
    DataReporter.calculatePercentage(
      reportShortcutsByArgCount,
      'active',
      reportShortcutsByArgCount.active.count,
    );
    [
      'active',
      'with tests',
      'with test-excuse',
      'with examples',
      'with tags',
      'with includes',
    ].forEach((key) => {
      DataReporter.calculatePercentage(
        reportShortcutsByProperties,
        key,
        reportShortcutsByProperties.active.count,
      );
    });
    ['all', 'active', 'deprecated', 'removed'].forEach((key) => {
      DataReporter.calculatePercentage(
        reportShortcutsByState,
        key,
        reportShortcutsByState.all.count,
      );
    });
    for (let i = 0; i < 7; i++) {
      if (reportShortcutsByArgCount[`with ${i} args`]) {
        DataReporter.calculatePercentage(
          reportShortcutsByArgCount,
          `with ${i} args`,
          reportShortcutsByProperties.active.count,
        );
      }
    }
    console.log('Shortcuts by namespaces:');
    console.table(reportShortcutsByNamespace);
    console.log('Shortcuts by state:');
    console.table(reportShortcutsByState);
    console.log('Shortcuts by arg count:');
    console.table(reportShortcutsByArgCount);
    console.log('Shortcuts by properties:');
    console.table(reportShortcutsByProperties);
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
