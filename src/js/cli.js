import { Command } from 'commander';
import DataManager from './modules/DataManager';

const program = new Command();

program.name('trovu').description('CLI for trovu.net').version('0.0.1');

program
  .command('compile-data')
  .description('Compile YAML data files to JSON')
  .action(() => {
    const data = DataManager.load();
    console.log(JSON.stringify(data));
  });
program.parse();
