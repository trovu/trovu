// @ts-nocheck
import Env from "./Env";

const getUrlHashFooBar = () => {
  const hash = "foo=bar&baz=boo";
  return hash;
};

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
        country: "at",
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
    expect(Env.getParamsFromUrl()).toEqual({ foo: "bar", baz: "boo" });
  });
  test("getBoolParams", () => {
    expect(Env.getBoolParams({ debug: "1", reload: "1", foo: "1" })).toEqual({
      debug: true,
      reload: true,
    });
  });

  describe("isExternalUrl", () => {
    beforeAll(() => {
      // Mock window.location.origin
      Object.defineProperty(window, "location", {
        value: { origin: "https://trovu.net" },
        writable: true,
      });
    });

    test("returns true for external URLs", () => {
      expect(Env.isExternalUrl("https://google.com")).toBe(true);
      expect(Env.isExternalUrl("https://www.youtube.com/watch?v=123")).toBe(true);
      expect(Env.isExternalUrl("https://maps.google.com")).toBe(true);
    });

    test("returns false for internal URLs", () => {
      expect(Env.isExternalUrl("https://trovu.net/process/index.html")).toBe(false);
      expect(Env.isExternalUrl("/process/index.html")).toBe(false);
      expect(Env.isExternalUrl("../index.html")).toBe(false);
    });

    test("returns false for invalid URLs", () => {
      expect(Env.isExternalUrl("")).toBe(false);
    });
  });
});
