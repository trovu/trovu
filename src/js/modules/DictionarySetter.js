import DataManager from './/DataManager';
import QueryParser from './QueryParser';
import UrlProcessor from './UrlProcessor';
import fs from 'fs';
import jsyaml from 'js-yaml';

export default class DictionarySetter {
  constructor() {}

  setDictionaries() {
    const data = DataManager.load();
    const dicts = DictionarySetter.getDictionaries();
    const langs = DictionarySetter.getLanguageList();
    const t = DictionarySetter.getTranslations();
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

  static getTranslations() {
    const translations = jsyaml.load(
      fs.readFileSync('src/yml/translations.yml', 'utf8'),
    );
    return translations;
  }
}
