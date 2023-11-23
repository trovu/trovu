import { Command } from 'commander';
import DataManager from './modules/DataManager';

const program = new Command();

program.name('trovu').description('CLI for trovu.net').version('0.0.1');

program
  .command('compile-data')
  .description('Compile YAML data files to JSON')
  .action(() => {
    const data = DataManager.load();
    const json = JSON.stringify(data);
    process.stdout.write(json);
  });

program
  .command('normalize-data')
  .description('Normalize YAML data files')
  .action(() => {
    const data = DataManager.load();
    DataManager.write(data);
  });

program.parse();
