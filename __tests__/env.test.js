import Env from "../src/Env.js";

const getNavigatorLanguageEnUk = () => {
  const languageStr = "en-uk";
  return languageStr;
};

const getNavigatorLanguageEmpty = () => {
  const languageStr = "";
  return languageStr;
};

test("getNavigatorLanguage", () => {
  const env = new Env();
  env.getNavigatorLanguage = getNavigatorLanguageEnUk;
  expect(env.getNavigatorLanguage()).toMatch("en-uk");
});

test("getLanguageAndCountryFromBrowser", () => {
  const env = new Env();
  env.getNavigatorLanguage = getNavigatorLanguageEnUk;
  expect(env.getLanguageAndCountryFromBrowser()).toEqual({
    language: "en",
    country: "uk"
  });
});

test("getDefaultLanguage", () => {
  const env = new Env();
  env.getNavigatorLanguage = getNavigatorLanguageEnUk;
  expect(env.getDefaultLanguage()).toMatch("en");
});

test("getDefaultCountry", () => {
  const env = new Env();
  env.getNavigatorLanguage = getNavigatorLanguageEnUk;
  expect(env.getDefaultCountry()).toMatch("uk");
});

test("getDefaultLanguageAndCountry when navigator.language empty", () => {
  const env = new Env();
  env.getNavigatorLanguage = getNavigatorLanguageEmpty;
  expect(env.getDefaultLanguageAndCountry()).toEqual({
    language: "en",
    country: "us"
  });
});

test("setDefaults", () => {
  const env = new Env();
  env.getNavigatorLanguage = getNavigatorLanguageEnUk;
  env.setDefaults();
  expect(env.language).toMatch("en");
  expect(env.country).toMatch("uk");
  expect(env.namespaces).toEqual(["o", "en", ".uk"]);
});

test("setWithUserConfigFromGithub", async () => {
  const env = new Env();
  env.getNavigatorLanguage = getNavigatorLanguageEnUk;
  env.getUserConfigFromGithub = async () => {
    return {
      namespaces: ["o", "en", ".us", { github: ".", name: "my" }],
      defaultKeyword: "g",
      language: "en",
      country: "us"
    };
  };
  await env.setWithUserConfigFromGithub();
  expect(env.namespaces).toEqual(["o", "en", ".us", { github: ".", name: "my" }]);
});
