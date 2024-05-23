import DataManager from './/DataManager';
import QueryParser from './QueryParser';
import UrlProcessor from './UrlProcessor';
import fs from 'fs';
import jsyaml from 'js-yaml';

export default class DictionarySetter {
  constructor() {
    this.langs = DictionarySetter.getLanguageList();
    this.t = DictionarySetter.getTranslations();
  }

  setDictionaries() {
    const data = DataManager.load();
    const dicts = DictionarySetter.getDictionaries();

    for (const dict in dicts) {
      const shortcuts = {};
      for (const lang1 in dicts[dict].pairs) {
        for (const lang2 in dicts[dict].pairs[lang1]) {
          if (!this.langs[lang2][lang1]) {
            console.log(`Missing code for ${lang1}-${lang2}`);
            return;
          }
          if (!this.t.tree[lang1]) {
            console.log(`Missing tree for ${lang1}`);
            return;
          }
          if (!this.t.tree[lang2]) {
            console.log(`Missing tree for ${lang2}`);
            return;
          }
          shortcuts[DictionarySetter.getKey(lang1, lang2, 0)] = {
            url: dicts[dict].pairs[lang1][lang2][0],
            title: this.getTitle(lang1, lang2, dicts[dict].name),
            tags: this.getTags(lang1, lang2),
          };
          shortcuts[DictionarySetter.getKey(lang1, lang2, 1)] = {
            url: dicts[dict].pairs[lang1][lang2][1],
            title: this.getTitle(lang1, lang2, dicts[dict].name),
            tags: this.getTags(lang1, lang2),
            examples: this.getExamples(lang1, lang2),
          };
          shortcuts[DictionarySetter.getKey(lang2, lang1, 0)] = {
            title: this.getTitle(lang2, lang1, dicts[dict].name),
            include: DictionarySetter.getKey(lang1, lang2, 0),
          };
          shortcuts[DictionarySetter.getKey(lang2, lang1, 1)] = {
            title: this.getTitle(lang2, lang1, dicts[dict].name),
            include: { key: DictionarySetter.getKey(lang1, lang2, 1) },
            examples: this.getExamples(lang2, lang1),
          };
        }
      }
      data.shortcuts[dict] = shortcuts;
    }
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

  static getKey(lang1, lang2, argumentCount) {
    return `${lang1}-${lang2} ${argumentCount}`;
  }

  getTitle(lang1, lang2, name) {
    return `${DictionarySetter.capitalize(
      this.langs[lang2][lang1],
    )}-${DictionarySetter.capitalize(this.langs[lang2][lang2])} (${name})`;
  }

  getTags(lang1, lang2) {
    return [
      'dictionary',
      'language',
      DictionarySetter.anticapitalize(this.langs['en'][lang1]),
      DictionarySetter.anticapitalize(this.langs['en'][lang2]),
    ];
  }

  getExamples(lang1, lang2) {
    return [
      {
        arguments: this.t.tree[lang1],
        description: this.t.desc[lang2]
          .replace('{lang}', this.langs[lang2][lang2])
          .replace('{tree}', this.t.tree[lang1]),
      },
      {
        arguments: this.t.tree[lang2],
        description: this.t.desc[lang2]
          .replace('{lang}', this.langs[lang2][lang1])
          .replace('{tree}', this.t.tree[lang2]),
      },
    ];
  }

  static capitalize(str) {
    const capitalized = str.charAt(0).toUpperCase() + str.slice(1);
    return capitalized;
  }

  static anticapitalize(str) {
    const capitalized = str.charAt(0).toLowerCase() + str.slice(1);
    return capitalized;
  }
}
