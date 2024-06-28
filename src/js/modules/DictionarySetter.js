import DataManager from ".//DataManager";
import fs from "fs";
import jsyaml from "js-yaml";

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
          // Skip if there is already a shortcut for this pair.
          if (shortcuts[DictionarySetter.getKey(lang1, lang2, 0)]) {
            continue;
          }
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

          const key0 = DictionarySetter.getKey(lang1, lang2, 0);
          const key1 = DictionarySetter.getKey(lang1, lang2, 1);
          const reverseKey0 = DictionarySetter.getKey(lang2, lang1, 0);
          const reverseKey1 = DictionarySetter.getKey(lang2, lang1, 1);

          shortcuts[key0] = {
            url: dicts[dict].pairs[lang1][lang2][0],
            title: this.getTitle(lang1, lang2, dicts[dict].name),
            tags: this.getTags(lang1, lang2),
            examples: this.getExampleHomepage(lang2),
          };
          shortcuts[key1] = {
            url: dicts[dict].pairs[lang1][lang2][1],
            title: this.getTitle(lang1, lang2, dicts[dict].name),
            tags: this.getTags(lang1, lang2),
            examples: this.getExamples(lang1, lang2),
          };
          shortcuts[reverseKey0] = {
            title: this.getTitle(lang2, lang1, dicts[dict].name),
            include: key0,
            examples: this.getExampleHomepage(lang1),
          };
          shortcuts[reverseKey1] = {
            title: this.getTitle(lang2, lang1, dicts[dict].name),
            include: key1,
            examples: this.getExamples(lang2, lang1),
          };

          // Add URL to reverse pair if explicitly defined
          if (dicts[dict].pairs[lang2] && dicts[dict].pairs[lang2][lang1]) {
            shortcuts[reverseKey0].url = dicts[dict].pairs[lang2][lang1][0];
            shortcuts[reverseKey1].url = dicts[dict].pairs[lang2][lang1][1];
          }
        }
      }
      data.shortcuts[dict] = shortcuts;
    }
    for (const dict in dicts) {
      console.log(dict);
      const langs = new Set();
      // Remember all langs we have in this dict.
      for (const lang1 in dicts[dict].pairs) {
        langs.add(lang1);
        for (const lang2 in dicts[dict].pairs[lang1]) {
          langs.add(lang2);
        }
      }
      // Add local includes with {$language} variable.
      for (const lang of langs) {
        data.shortcuts[dict][`${lang} 0`] = {
          include: lang + "-<$language> 0",
        };
        data.shortcuts[dict][`${lang} 1`] = {
          include: lang + "-<$language> 1",
        };
      }
    }

    const langs = {};
    for (const dict in dicts) {
      // Remember all langs we have in this dict.
      for (const lang1 in dicts[dict].pairs) {
        if (!langs[lang1]) {
          langs[lang1] = new Set();
        }
        langs[lang1].add(dict);
        for (const lang2 in dicts[dict].pairs[lang1]) {
          if (!langs[lang2]) {
            langs[lang2] = new Set();
          }
          langs[lang2].add(dict);
        }
      }
    }
    const dictsByPrioStr =
      "ama ard dtn crd deo esd flx hzn irs mdb umt wdk zrg lge dcm bab leo dcc lgs pns rvs beo pka";

    const dictsByPrio = dictsByPrioStr.split(" ");

    const o = data.shortcuts.o;
    for (const lang in langs) {
      o[`${lang} 0`] = {};
      o[`${lang} 1`] = {};
      for (const dict of dictsByPrio) {
        if (langs[lang].has(dict)) {
          for (const argCount of [0, 1]) {
            if (!o[`${lang} ${argCount}`]) {
              o[`${lang} ${argCount}`] = {};
            }
            if (!o[`${lang} ${argCount}`].include) {
              o[`${lang} ${argCount}`].include = [];
            }
            o[`${lang} ${argCount}`].include.push({
              key: `${lang} ${argCount}`,
              namespace: dict,
            });
          }
        }
      }
    }
    data.shortcuts.o = o;
    DataManager.write(data);
  }

  static getDictionaries() {
    return jsyaml.load(fs.readFileSync("src/yml/dictionaries.yml", "utf8"));
  }

  static getLanguageList() {
    const langs = {};
    const dirs = fs.readdirSync("./node_modules/languagelist/data/");
    for (const dir of dirs) {
      const lang = jsyaml.load(fs.readFileSync(`./node_modules/languagelist/data/${dir}/language.yaml`, "utf8"));
      langs[dir] = lang;
    }
    return langs;
  }

  static getTranslations() {
    const translations = jsyaml.load(fs.readFileSync("src/yml/translations.yml", "utf8"));
    return translations;
  }

  static getKey(lang1, lang2, argumentCount) {
    return `${lang1}-${lang2} ${argumentCount}`;
  }

  getTitle(lang1, lang2, name) {
    return `${DictionarySetter.capitalize(this.langs[lang2][lang1])}-${DictionarySetter.capitalize(
      this.langs[lang2][lang2],
    )} (${name})`;
  }

  getTags(lang1, lang2) {
    return [
      "dictionary",
      "language",
      DictionarySetter.anticapitalize(this.langs["en"][lang1]),
      DictionarySetter.anticapitalize(this.langs["en"][lang2]),
    ];
  }

  getExamples(lang1, lang2) {
    return [
      {
        arguments: this.t.tree[lang1],
        description: this.t.desc[lang2]
          .replace("{lang}", this.langs[lang2][lang2])
          .replace("{tree}", this.t.tree[lang1]),
      },
      {
        arguments: this.t.tree[lang2],
        description: this.t.desc[lang2]
          .replace("{lang}", this.langs[lang2][lang1])
          .replace("{tree}", this.t.tree[lang2]),
      },
    ];
  }

  getExampleHomepage(lang) {
    return [
      {
        description: this.t.goToHomepage[lang],
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
