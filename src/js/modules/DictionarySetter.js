import DataManager from './/DataManager';
import QueryParser from './QueryParser';
import UrlProcessor from './UrlProcessor';
import fs from 'fs';
import jsyaml from 'js-yaml';

export default class DictionarySetter {
  constructor() {}

  setDictionaries() {
    const data = DataManager.load();
    const langs = DictionarySetter.getLanguageList();
    const t = jsyaml.load(fs.readFileSync('src/yml/translations.yml', 'utf8'));
    const dicts = DictionarySetter.getDictionaries();
    DataManager.write(data);
  }

  static getDictionaries() {
    return jsyaml.load(fs.readFileSync('src/yml/dictionaries.yml', 'utf8'));
  }

  static getLanguageList() {
    const langs = {};
    const dirs = fs.readdirSync('./node_modules/languagelist/data/');
    for (const dir of dirs) {
      const lang = jsyaml.load(
        fs.readFileSync(
          `./node_modules/languagelist/data/${dir}/language.yaml`,
          'utf8',
        ),
      );
      langs[dir] = lang;
    }
    return langs;
  }
}
