// Ignoring all undefined here because require() is not recognized when linting as ESM.

/* eslint-disable no-undef */
import UrlProcessor from "./modules/UrlProcessor";

// Helper scripts for managing shortcuts in https://github.com/trovu/trovu-data/.

const actions = {};
const fs = require("fs");
const isValidDomain = require("is-valid-domain");
const jsyaml = require("js-yaml");
const modifiers = {};

let ymlDirPath;

async function main() {
  if (process.argv.length < 3) {
    console.log("Usage: node index.js action [path]");
    return;
  }

  ymlDirPath = "./data/shortcuts/";

  const action = process.argv[2];
  if (action in actions) {
    actions[action]();
  } else {
    console.log("Action must be one of: ", Object.keys(actions));
  }
}

function loadYmls() {
  const ymls = {};
  const ymlFileNames = fs.readdirSync(ymlDirPath);
  for (const ymlFileName of ymlFileNames) {
    const ymlFilePath = ymlDirPath + ymlFileName;
    const ymlStr = fs.readFileSync(ymlFilePath, "utf8");
    const shortcuts = jsyaml.load(ymlStr);
    ymls[ymlFileName] = shortcuts;
  }
  return ymls;
}

function writeYmls(ymls) {
  for (const ymlFileName in ymls) {
    const ymlFilePath = ymlDirPath + ymlFileName;
    const yml = ymls[ymlFileName];
    const ymlSorted = sortObject(yml);
    // Sort tags.
    for (const shortcut of Object.values(yml)) {
      if (shortcut.tags) shortcut.tags.sort();
    }
    // Normalize examples.
    for (const shortcut of Object.values(yml)) {
      if (shortcut.examples && !Array.isArray(shortcut.examples)) {
        const examples = [];
        for (const [argumentString, description] of Object.entries(shortcut.examples)) {
          const example = {
            arguments: argumentString,
            description: description,
          };
          examples.push(example);
        }
        shortcut.examples = examples;
      }
    }
    // Cleanup deprecated shortcuts.
    for (const shortcut of Object.values(yml)) {
      if (shortcut.deprecated) {
        delete shortcut.tags;
        delete shortcut.examples;
        delete shortcut.description;
        delete shortcut.url;
        delete shortcut.title;
      }
    }
    // TODO:
    // trim strings: - keys - titles - examples - description
    // make sure, subkeys are in reverse particular order: url, post_params, description, tags, examples
    const ymlStr = jsyaml.dump(ymlSorted, {
      noArrayIndent: true,
      lineWidth: -1,
    });
    fs.writeFileSync(ymlFilePath, ymlStr);
  }
  return ymls;
}

actions["normalize"] = async function () {
  const ymls = loadYmls();
  writeYmls(ymls);
};

actions["compile-data"] = async function () {
  const ymls = loadYmls();
  const compiled = {};
  compiled["shortcuts"] = {};
  for (const ymlFileName in ymls) {
    const namespace = ymlFileName.replace(".yml", "");
    compiled.shortcuts[namespace] = ymls[ymlFileName];
  }
  console.log(JSON.stringify(compiled));
};

function sortObject(obj) {
  return Object.keys(obj)
    .sort()
    .reduce(function (result, key) {
      result[key] = obj[key];
      return result;
    }, {});
}

const isValidUrl = (urlString) => {
  try {
    return Boolean(new URL(urlString));
  } catch (e) {
    console.error(e);
    return false;
  }
};

async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 5000 } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  let response;
  try {
    response = await fetch(resource, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
      },
    });
  } catch (e) {
    console.error(e);
    return { status: 500 };
  }
  clearTimeout(id);
  return response;
}

actions["testFetch"] = async function () {
  const response = await fetchWithTimeout(process.argv[3]);
  console.log(response);
};

actions["listKeys"] = async function () {
  const ymlsAll = loadYmls();
  const ymls = {};
  const ymlFileName = process.argv[3] + ".yml";
  ymls[ymlFileName] = ymlsAll[ymlFileName];
  for (const ymlFilePath in ymls) {
    const yml = ymls[ymlFilePath];
    for (const key in yml) {
      console.log(key);
    }
  }
};

actions["applyModifier"] = async function () {
  const ymlsAll = loadYmls();
  const ymls = {};
  const ymlFileName = `${process.argv[4].trim()}.yml`;
  ymls[ymlFileName] = ymlsAll[ymlFileName];
  for (const ymlFilePath in ymls) {
    const yml = ymls[ymlFilePath];
    for (const key in yml) {
      let shortcut = yml[key];
      shortcut = await modifiers[process.argv[3].trim()](key, shortcut);
      if (!shortcut) {
        delete yml[key];
      }
    }
  }
  writeYmls(ymls);
  console.log("Done");
};

actions["createDictionaryScaffold"] = async function () {
  const langs = getLanguageList();
  const dcm_langs_str =
    "ar bg ca cs da de el en es et fi fr he hr hu id it ja ko lt lv nl no pl pt ro ru sk sl sr sv th tr uk vi zh";
  const dcmLangs = dcm_langs_str.split(" ");
  const scaffold = {};
  for (let i = 0; i < dcmLangs.length - 1; i++) {
    scaffold[dcmLangs[i]] = {};
    for (let j = i + 1; j < dcmLangs.length; j++) {
      const template = `https://www.dict.com/${langs["en"][dcmLangs[i]].toLowerCase()}-${langs["en"][
        dcmLangs[j]
      ].toLowerCase()}/`;
      scaffold[dcmLangs[i]][dcmLangs[j]] = [template, template + "{%word}"];
    }
  }
  const scaffoldStr = jsyaml.dump(scaffold, {
    noArrayIndent: true,
    lineWidth: -1,
  });
  console.log(scaffoldStr);
};

modifiers["addTagOld"] = async function (key, shortcut) {
  if (!shortcut.tags) {
    shortcut.tags = [];
  }
  shortcut.tags.push("old");
  return shortcut;
};

modifiers["removeYahooCurrencyConverters"] = async function (key, shortcut) {
  if (shortcut.title.search(new RegExp("^Convert .*Yahoo.$")) > -1) {
    console.log("Removing ", shortcut.title);
    return false;
  }
  return shortcut;
};

modifiers["removeGoogleMapsCities"] = async function (key, shortcut) {
  if (key.search(new RegExp("^gm.+")) > -1 && !key.match(new RegExp("^gm(b|hh|m|k|f|s|d|l|do|e|hb|dd|h|n|du) 1"))) {
    console.log("Removing", shortcut.title);
    return false;
  }
  return shortcut;
};

modifiers["deprecateGoogleMapsCities"] = async function (key, shortcut) {
  let matches;
  if ((matches = key.match(new RegExp("^gm(.+) ")))) {
    const city = matches[1];
    console.log("Deprecating", shortcut.title);
    shortcut.deprecated = {
      alternative: {
        query: `gm ${city},{%1}`,
      },
      created: "2023-01-07",
    };
    console.log(shortcut);
  }
  return shortcut;
};

modifiers["removeDictionaryDashIncludes"] = async function (key, shortcut) {
  if (key.match(new RegExp("^..-...")) && shortcut.include) {
    console.log(`Removing ${key}`);
    return false;
  }
  return shortcut;
};

modifiers["removeDeadDomains"] = async function (key, shortcut) {
  const skipDomains = ["colourlovers.com", "iafd.com", "tcodesearch.com", "debian.org", "reddit.com"];
  for (const skipDomain of skipDomains) {
    if (shortcut.url.search(new RegExp(skipDomain, "i")) > -1) {
      console.log("Skipping listed domain:", shortcut.url);
      return shortcut;
    }
  }
  if (!isValidUrl(shortcut.url)) {
    console.log("Skipping invalid URL:", shortcut.url);
    return shortcut;
  }
  const url = new URL(shortcut.url);
  if (!isValidDomain(url.hostname)) {
    console.log("Skipping invalid hostname:", url.host);
    return shortcut;
  }
  // console.log(url.host);
  const testUrl = url.protocol + "//" + url.host;
  try {
    // console.log(testUrl, "...");
    const response = await fetchWithTimeout(testUrl);
    if (response.status != 200) {
      console.log(response.status, testUrl);
      return false;
    }
  } catch (error) {
    console.log(url.host);
    console.error(error);
    return false;
  }
  return shortcut;
};

modifiers["checkShortcutResponse"] = async function (key, shortcut) {
  if (shortcut.deprecated) {
    return shortcut;
  }
  // Only letter a for now.
  if (!key[0].match(/[^a-z]/)) {
    //return shortcut;
  }
  let url = shortcut.url;
  const args = ["foo", "bar", "baz", "a", "b", "c"];
  const env = { language: "de", country: "de" };
  url = await UrlProcessor.replaceArguments(url, args, env);
  url = UrlProcessor.replaceVariables(url, env);
  console.log(key);
  const response = await fetchWithTimeout(url);
  if (response.status != 200) {
    console.log(response.status, url);
  }
  return shortcut;
};

actions["setDictionaryIncludes"] = async function () {
  const dicts = getDictionaries();
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
  const dictsByPrioStr = "ama ard dtn crd deo esd flx hzn irs mdb umt wdk zrg lge dcm bab leo dcc lgs pns rvs beo pka";

  const dictsByPrio = dictsByPrioStr.split(" ");

  const ymls = loadYmls();
  const yml = ymls["o.yml"];
  for (const lang in langs) {
    yml[`${lang} 0`] = {};
    yml[`${lang} 1`] = {};
    for (const dict of dictsByPrio) {
      if (langs[lang].has(dict)) {
        for (const argCount of [0, 1]) {
          if (!yml[`${lang} ${argCount}`]) {
            yml[`${lang} ${argCount}`] = {};
          }
          if (!yml[`${lang} ${argCount}`].include) {
            yml[`${lang} ${argCount}`].include = [];
          }
          yml[`${lang} ${argCount}`].include.push({
            key: `${lang} ${argCount}`,
            namespace: dict,
          });
        }
      }
    }
  }
  writeYmls(ymls);
};

actions["setDictionaries"] = async function () {
  const langs = getLanguageList();
  const t = jsyaml.load(fs.readFileSync("src/yml/translations.yml", "utf8"));
  const dicts = getDictionaries();

  const ymls = {};
  for (const dict in dicts) {
    const shortcuts = {};
    for (const lang1 in dicts[dict].pairs) {
      for (const lang2 in dicts[dict].pairs[lang1]) {
        if (!langs[lang2][lang1]) {
          console.log(`Missing code for ${lang1}-${lang2}`);
          return;
        }
        if (!t.tree[lang1]) {
          console.log(`Missing tree for ${lang1}`);
          return;
        }
        if (!t.tree[lang2]) {
          console.log(`Missing tree for ${lang2}`);
          return;
        }
        shortcuts[getKey(lang1, lang2, 0)] = {
          url: dicts[dict].pairs[lang1][lang2][0],
          title: getTitle(lang1, lang2, dicts[dict].name),
          tags: getTags(lang1, lang2),
        };
        shortcuts[getKey(lang1, lang2, 1)] = {
          url: dicts[dict].pairs[lang1][lang2][1],
          title: getTitle(lang1, lang2, dicts[dict].name),
          tags: getTags(lang1, lang2),
          examples: getExamples(lang1, lang2),
        };
        shortcuts[getKey(lang2, lang1, 0)] = {
          title: getTitle(lang2, lang1, dicts[dict].name),
          include: { key: getKey(lang1, lang2, 0) },
        };
        shortcuts[getKey(lang2, lang1, 1)] = {
          title: getTitle(lang2, lang1, dicts[dict].name),
          include: { key: getKey(lang1, lang2, 1) },
          examples: getExamples(lang2, lang1),
        };
      }
    }
    ymls[`${dict}.yml`] = shortcuts;
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
      ymls[`${dict}.yml`][`${lang} 0`] = {
        include: {
          key: lang + "-{$language} 0",
        },
      };
      ymls[`${dict}.yml`][`${lang} 1`] = {
        include: {
          key: lang + "-{$language} 1",
        },
      };
    }
  }
  writeYmls(ymls);

  function getKey(lang1, lang2, argumentCount) {
    return `${lang1}-${lang2} ${argumentCount}`;
  }
  function getTitle(lang1, lang2, name) {
    return `${capitalize(langs[lang2][lang1])}-${capitalize(langs[lang2][lang2])} (${name})`;
  }
  function getTags(lang1, lang2) {
    return ["dictionary", "language", anticapitalize(langs["en"][lang1]), anticapitalize(langs["en"][lang2])];
  }
  function getExamples(lang1, lang2) {
    return {
      [t.tree[lang1]]: t.desc[lang2].replace("{lang}", langs[lang2][lang2]).replace("{tree}", t.tree[lang1]),
      [t.tree[lang2]]: t.desc[lang2].replace("{lang}", langs[lang2][lang1]).replace("{tree}", t.tree[lang2]),
    };
  }
  function capitalize(str) {
    const capitalized = str.charAt(0).toUpperCase() + str.slice(1);
    return capitalized;
  }
  function anticapitalize(str) {
    const capitalized = str.charAt(0).toLowerCase() + str.slice(1);
    return capitalized;
  }
};

function getDictionaries() {
  return jsyaml.load(fs.readFileSync("src/yml/dictionaries.yml", "utf8"));
}

function getLanguageList() {
  const langs = {};
  const dirs = fs.readdirSync("./node_modules/languagelist/data/");
  for (const dir of dirs) {
    const lang = jsyaml.load(fs.readFileSync(`./node_modules/languagelist/data/${dir}/language.yaml`, "utf8"));
    langs[dir] = lang;
  }
  return langs;
}

main();
