// @ts-nocheck
import DataCompiler from "./modules/DataCompiler";
import DataManager from "./modules/DataManager";
import DataReporter from "./modules/DataReporter";
import DictionarySetter from "./modules/DictionarySetter";
import Migrator from "./modules/Migrator";
import ShortcutTester from "./modules/ShortcutTester";
import Validator from "./modules/Validator";
import { Command } from "commander";
import fs from "fs";

const program = new Command();

program.name("trovu").description("CLI for trovu.net").version("0.0.1");

program
  .command("compile-data")
  .description("Compile YAML data files to JSON")
  .requiredOption("-o, --output <path>", "path to output file")
  .action(compileData);

program
  .command("migrate-examples")
  .description("Migrate examples to new format")
  .option("-d, --data <path>", "path to data directory")
  .option("-s, --shortcuts <subpath>", "subpath to shortcuts directory")
  .option("-t, --types <subpath>", "subpath to types directory")
  .option("-f, --filter <string>", "only apply to files containing <string>")
  .action(migrateExamples);

program.command("migrate-include").description("Migrate include.key to include").action(migrateInclude);

// Call for user data:
// node -r esm src/js/cli.js migrate-placeholders -d /Users/jrg/dta/int/cde/web/tro/trovu-data-user/ -s '' -f shortcuts
program
  .command("migrate-placeholders")
  .description("Migrate custom placeholder format to YAML ")
  .option("-d, --data <path>", "path to data directory")
  .option("-s, --shortcuts <subpath>", "subpath to shortcuts directory")
  .option("-t, --types <subpath>", "subpath to types directory")
  .option("-f, --filter <string>", "only apply to files containing <string>")
  .action(migratePlaceholders);

program
  .command("migrate-protocol")
  .description("Migrate http to https")
  .option("-f, --filter <string>", "only apply to files containing <string>")
  .action(migrateProtocol);

program.command("normalize-data").description("Normalize YAML data files").action(normalizeData);

program
  .command("report-data")
  .description("Report data statistics")
  .option("-n, --namespace <string>", "only apply to shortcuts of this namespace")
  .action(reportData);

program.command("set-dictionaries").description("Set dictionaries").action(setDictionaries);

program
  .command("test-shortcuts")
  .description("Test shortcut URLs, write HTML src of failed tests to ./failed-shortcuts/")
  .option("-f, --filter <string>", "only apply to shortcuts containing <string>")
  .option("-e, --examples", "run smoke tests using examples")
  .option("-v, --verbose", "log fetches and succeeded tests")
  .action(testShortcuts);

program.command("validate-data").description("Validate YAML data against schema").action(validateData);

program.parse();

function compileData(options) {
  const data = DataManager.load();
  data.git = DataCompiler.getGitInfo();
  data.config = DataCompiler.getConfig();
  const json = JSON.stringify(data);
  fs.writeFileSync(options.output, json, "utf8");
}

function migrateExamples(options) {
  const migrator = new Migrator();
  migrator.migrateExamples(options);
}

async function migrateInclude() {
  const migrator = new Migrator();
  await migrator.migrateInclude();
}

function migratePlaceholders(options) {
  const migrator = new Migrator();
  migrator.migratePlaceholders(options);
}

async function migrateProtocol(options) {
  const migrator = new Migrator();
  await migrator.migrateProtocol(options);
}

function normalizeData() {
  const data = DataManager.load();
  DataManager.write(data);
}

function reportData(options) {
  const dataReporter = new DataReporter(options);
  dataReporter.reportData();
}

function setDictionaries() {
  const dictionarySetter = new DictionarySetter();
  dictionarySetter.setDictionaries();
}

function testShortcuts(options) {
  const shortcutTester = new ShortcutTester(options);
  shortcutTester.testShortcuts();
}

function validateData() {
  const validator = new Validator();
  validator.validateShortcuts();
}
