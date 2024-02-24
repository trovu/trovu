import DataManager from './modules/DataManager';
import Migrator from './modules/Migrator';
import ShortcutTester from './modules/ShortcutTester';
import ajv from 'ajv';
import { Command } from 'commander';
import fs from 'fs';
import jsyaml from 'js-yaml';

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

program.parse();

function validateData() {
  const validator = new ajv({ strict: true });
  const schema = jsyaml.load(fs.readFileSync('data/schema/shortcuts.yml'));
  const data = DataManager.load();
  let hasError = false;
  for (const namespace in data.shortcuts) {
    if (!validator.validate(schema, data.shortcuts[namespace])) {
      hasError = true;
      console.error(
        `Problem in namespace ${namespace}: ${validator.errorsText()}`,
      );
    }
  }
  if (hasError) {
    // eslint-disable-next-line no-undef
    process.exit(1);
  }
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

function migrateExamples(options) {
  const migrator = new Migrator();
  migrator.migrateExamples(options);
}

function migratePlaceholders(options) {
  const migrator = new Migrator();
  migrator.migratePlaceholders(options);
}
