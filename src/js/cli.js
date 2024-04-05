import DataManager from './modules/DataManager';
import DataReporter from './modules/DataReporter';
import Migrator from './modules/Migrator';
import ShortcutTester from './modules/ShortcutTester';
import Validator from './modules/Validator';
import { Command } from 'commander';
import fs from 'fs';

const program = new Command();

program.name('trovu').description('CLI for trovu.net').version('0.0.1');

program
  .command('validate-data')
  .description('Validate YAML data against schema')
  .action(validateData);

program
  .command('compile-data')
  .description('Compile YAML data files to JSON')
  .requiredOption('-o, --output <path>', 'path to output file')
  .action(compileData);

program
  .command('normalize-data')
  .description('Normalize YAML data files')
  .action(normalizeData);

program
  .command('test-shortcuts')
  .description('Test shortcut URLs')
  .option(
    '-f, --filter <string>',
    'only apply to shortcuts containing <string>',
  )
  .action(testShortcuts);

program
  .command('report-data')
  .description('Report data statistics')
  .option(
    '-n, --namespace <string>',
    'only apply to shortcuts of this namespace',
  )
  .action(reportData);

// Call for user data:
// node -r esm src/js/cli.js migrate-placeholders -d /Users/jrg/dta/int/cde/web/tro/trovu-data-user/ -s '' -f shortcuts
program
  .command('migrate-placeholders')
  .description('Migrate custom placeholder format to YAML ')
  .option('-d, --data <path>', 'path to data directory')
  .option('-s, --shortcuts <subpath>', 'subpath to shortcuts directory')
  .option('-t, --types <subpath>', 'subpath to types directory')
  .option('-f, --filter <string>', 'only apply to files containing <string>')
  .action(migratePlaceholders);

program
  .command('migrate-examples')
  .description('Migrate examples to new format')
  .option('-d, --data <path>', 'path to data directory')
  .option('-s, --shortcuts <subpath>', 'subpath to shortcuts directory')
  .option('-t, --types <subpath>', 'subpath to types directory')
  .option('-f, --filter <string>', 'only apply to files containing <string>')
  .action(migrateExamples);

program
  .command('migrate-protocol')
  .description('Migrate http to https')
  .option('-f, --filter <string>', 'only apply to files containing <string>')
  .action(migrateProtocol);

program.parse();

function validateData() {
  const validator = new Validator();
  validator.validateShortcuts();
}

function compileData(options) {
  const data = DataManager.load();
  const json = JSON.stringify(data);
  fs.writeFileSync(options.output, json, 'utf8');
}

function normalizeData() {
  const data = DataManager.load();
  DataManager.write(data);
}

function testShortcuts(options) {
  const shortcutTester = new ShortcutTester(options);
  shortcutTester.testShortcuts();
}

function reportData(options) {
  const dataReporter = new DataReporter(options);
  dataReporter.reportData();
}

function migrateExamples(options) {
  const migrator = new Migrator();
  migrator.migrateExamples(options);
}

function migratePlaceholders(options) {
  const migrator = new Migrator();
  migrator.migratePlaceholders(options);
}

function migrateProtocol(options) {
  const migrator = new Migrator();
  migrator.migrateProtocol(options);
}
