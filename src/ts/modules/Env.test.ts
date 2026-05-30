import Env from "./Env";
import NamespaceFetcher from "./NamespaceFetcher";

const getUrlHashFooBar = () => {
  const hash = "query=g%20foo&language=de&debug=1&logger=evil&data=evil";
  return hash;
};

const originalFetch = global.fetch;
const originalIntlLocale = Intl.Locale;
const minimalData = {
  config: {
    language: "en",
    country: "gb",
    namespaces: [],
  },
  shortcuts: {},
  types: {},
};

afterEach(() => {
  global.fetch = originalFetch;
  Object.defineProperty(Intl, "Locale", {
    configurable: true,
    value: originalIntlLocale,
    writable: true,
  });
  jest.restoreAllMocks();
});

describe("Env", () => {
  describe("getDefaultLanguageAndCountry", () => {
    test("browser returns language and country", () => {
      const env = new Env({ data: { config: { language: "pl", country: "at" } } });
      env.getNavigatorLanguage = jest.fn(() => "en-DE");
      expect(env.getDefaultLanguageAndCountry()).toEqual({
        language: "en",
        country: "de",
      });
    });
    test("browser returns only language", () => {
      const env = new Env({ data: { config: { language: "pl", country: "at" } } });
      env.getNavigatorLanguage = jest.fn(() => "en");
      expect(env.getDefaultLanguageAndCountry()).toEqual({
        language: "en",
        country: "us",
      });
    });
    test("browser returns language and script", () => {
      const env = new Env({ data: { config: { language: "pl", country: "at" } } });
      env.getNavigatorLanguage = jest.fn(() => "zh-Hant");
      expect(env.getDefaultLanguageAndCountry()).toEqual({
        language: "zh",
        country: "tw",
      });
    });
    test("browser returns empty language", () => {
      const env = new Env({ data: { config: { language: "pl", country: "at" } } });
      env.getNavigatorLanguage = jest.fn(() => "");
      expect(env.getDefaultLanguageAndCountry()).toEqual({
        language: "pl",
        country: "at",
      });
    });
    test("browser returns invalid language", () => {
      const env = new Env({ data: { config: { language: "pl", country: "at" } } });
      env.getNavigatorLanguage = jest.fn(() => "invalid");
      expect(env.getDefaultLanguageAndCountry()).toEqual({
        language: "pl",
        country: "at",
      });
    });
    test("Intl.Locale throws", () => {
      const env = new Env({ data: { config: { language: "pl", country: "at" } } });
      env.getNavigatorLanguage = jest.fn(() => "en-US-u");
      expect(env.getDefaultLanguageAndCountry()).toEqual({
        language: "en",
        country: "us",
      });
    });
    test("browser returns invalid country", () => {
      const env = new Env({ data: { config: { language: "pl", country: "at" } } });
      env.getNavigatorLanguage = jest.fn(() => "en-XX");
      expect(env.getDefaultLanguageAndCountry()).toEqual({
        language: "en",
        country: "at",
      });
    });
    test("browser returns language without country guess", () => {
      const env = new Env({ data: { config: { language: "pl", country: "at" } } });
      env.getNavigatorLanguage = jest.fn(() => "eo");
      expect(env.getDefaultLanguageAndCountry()).toEqual({
        language: "eo",
        country: "at",
      });
    });
    test("Intl.Locale is unavailable", () => {
      Object.defineProperty(Intl, "Locale", {
        configurable: true,
        value: undefined,
      });
      const env = new Env({ data: { config: { language: "pl", country: "at" } } });
      env.getNavigatorLanguage = jest.fn(() => "en");
      expect(env.getDefaultLanguageAndCountry()).toEqual({
        language: "en",
        country: "at",
      });
    });
    test("Intl.Locale.maximize is unavailable", () => {
      Object.defineProperty(Intl, "Locale", {
        configurable: true,
        value: class {
          language: string;

          constructor(language: string) {
            this.language = language;
          }
        },
      });
      const env = new Env({ data: { config: { language: "pl", country: "at" } } });
      env.getNavigatorLanguage = jest.fn(() => "en");
      expect(env.getDefaultLanguageAndCountry()).toEqual({
        language: "en",
        country: "at",
      });
    });
  });

  describe("buildUrlParams", () => {
    test("github", () => {
      expect(new Env({ github: "johndoe" }).buildUrlParams()).toEqual({
        github: "johndoe",
      });
    });
    test("configUrl in originalParams", () => {
      expect(
        new Env().buildUrlParams({
          configUrl: "https://example.com/config.yml",
        }),
      ).toEqual({
        configUrl: "https://example.com/config.yml",
      });
    });
    test("defaultKeyword in originalParams", () => {
      expect(
        new Env({
          country: "us",
          language: "en",
        }).buildUrlParams({
          defaultKeyword: "w",
        }),
      ).toEqual({
        country: "us",
        language: "en",
        defaultKeyword: "w",
      });
    });
    test("language and country", () => {
      expect(new Env({ language: "en", country: "us" }).buildUrlParams()).toEqual({
        language: "en",
        country: "us",
      });
    });
    test("debug", () => {
      expect(new Env({ debug: true }).buildUrlParams()).toEqual({
        debug: 1,
      });
    });
    test("status", () => {
      expect(new Env({ status: "deprecated" }).buildUrlParams()).toEqual({
        status: "deprecated",
      });
    });
  });

  test("getParamsFromUrl", () => {
    Env.getUrlHash = getUrlHashFooBar;
    expect(Env.getParamsFromUrl()).toEqual({ query: "g foo", language: "de", debug: "1" });
  });
  test("getBoolParams", () => {
    expect(Env.getBoolParams({ debug: "1", reload: "1", foo: "1" })).toEqual({
      debug: true,
      reload: true,
    });
  });
  test("pickUrlParams", () => {
    expect(
      Env.pickUrlParams({
        query: "g foo",
        github: "johndoe",
        logger: "evil",
        data: "evil",
      }),
    ).toEqual({
      query: "g foo",
      github: "johndoe",
    });
  });

  describe("populate", () => {
    test("uses reload cache for the initial data fetch when query starts with reload on index", async () => {
      const response = {
        status: 200,
        text: jest.fn().mockResolvedValue(JSON.stringify(minimalData)),
      };
      const fetchMock = jest.fn().mockResolvedValue(response as unknown as Response);
      global.fetch = fetchMock as typeof fetch;
      jest.spyOn(Env, "fetchLog").mockImplementation(() => {});
      jest.spyOn(NamespaceFetcher.prototype, "getNamespaceInfos").mockResolvedValue({});

      const env = new Env({ context: "index" });
      await env.populate({ query: "reload:g foo" });

      expect(fetchMock).toHaveBeenCalledWith("/data.json?version=unknown", {
        cache: "reload",
      });
      expect(env.reload).toBe(true);
      expect(env.query).toBe("g foo");
    });

    test("uses reload cache for the initial data fetch when query is reload on process", async () => {
      const response = {
        status: 200,
        text: jest.fn().mockResolvedValue(JSON.stringify(minimalData)),
      };
      const fetchMock = jest.fn().mockResolvedValue(response as unknown as Response);
      global.fetch = fetchMock as typeof fetch;
      jest.spyOn(Env, "fetchLog").mockImplementation(() => {});
      jest.spyOn(NamespaceFetcher.prototype, "getNamespaceInfos").mockResolvedValue({});

      const env = new Env({ context: "process" });
      await env.populate({ query: "reload" });

      expect(fetchMock).toHaveBeenCalledWith("/data.json?version=unknown", {
        cache: "reload",
      });
      expect(env.reload).toBe(true);
      expect(env.query).toBe("");
    });

    test("keeps the initial data fetch cached for normal queries", async () => {
      const response = {
        status: 200,
        text: jest.fn().mockResolvedValue(JSON.stringify(minimalData)),
      };
      const fetchMock = jest.fn().mockResolvedValue(response as unknown as Response);
      global.fetch = fetchMock as typeof fetch;
      jest.spyOn(Env, "fetchLog").mockImplementation(() => {});
      jest.spyOn(NamespaceFetcher.prototype, "getNamespaceInfos").mockResolvedValue({});

      const env = new Env({ context: "process" });
      await env.populate({ query: "g foo" });

      expect(fetchMock).toHaveBeenCalledWith("/data.json?version=unknown", {
        cache: "force-cache",
      });
      expect(env.reload).toBeUndefined();
      expect(env.query).toBe("g foo");
    });
  });
});
