// @ts-nocheck
import UrlProcessor from "./UrlProcessor";

describe("UrlProcessor", () => {
  test("transformEoCx", async () => {
    const expectations = {
      "ehxosxangxo cxiujxauxde": "eĥoŝanĝo ĉiuĵaŭde",
      "EHXOSXANGXO CXIUJXAUXDE": "EĤOŜANĜO ĈIUĴAŬDE",
      "EHxOSxANGxO CxIUJxAUxDE": "EĤOŜANĜO ĈIUĴAŬDE",
    };
    for (const input in expectations) {
      const output = await UrlProcessor.transformEoCx(input);
      expect(output).toEqual(expectations[input]);
    }
  });

  test("getVariablesFromString new", async () => {
    expect(UrlProcessor.getVariablesFromString("https://<$language>.<query>")).toEqual({
      language: {
        "<$language>": {},
      },
    });
  });

  test("getVariablesFromString legacy", async () => {
    expect(UrlProcessor.getVariablesFromString("https://{$language}.{%query}")).toEqual({
      language: {
        "{$language}": {},
      },
    });
  });

  test("getArgumentsFromString new", async () => {
    expect(UrlProcessor.getArgumentsFromString("https://<$language>.<query>")).toEqual({
      query: {
        "<query>": {},
      },
    });
  });

  test("getArgumentsFromString legacy", async () => {
    expect(UrlProcessor.getArgumentsFromString("https://{%query}")).toEqual({
      query: {
        "{%query}": {},
      },
    });
  });

  describe("getPlaceholderFromString", () => {
    test("without attributes", async () => {
      expect(UrlProcessor.getPlaceholdersFromString("https://<query>", "")).toEqual({
        query: {
          "<query>": {},
        },
      });
    });

    test("without attributes legacy", async () => {
      expect(UrlProcessor.getPlaceholdersFromStringLegacy("https://{%query}", "%")).toEqual({
        query: {
          "{%query}": {},
        },
      });
    });

    test("with attributes", async () => {
      expect(UrlProcessor.getPlaceholdersFromString("https://<Start: { type: city }>", "")).toEqual({
        Start: {
          "<Start: { type: city }>": {
            type: "city",
          },
        },
      });
    });

    test("with attributes legacy", async () => {
      expect(UrlProcessor.getPlaceholdersFromStringLegacy("https://{%Start|type=city}", "%")).toEqual({
        Start: {
          "{%Start|type=city}": {
            type: "city",
          },
        },
      });
    });
  });

  describe("getPlaceholderFromMatch", () => {
    test("without attributes", async () => {
      expect(UrlProcessor.getPlaceholderFromMatch([undefined, "query"])).toEqual({
        name: "query",
        placeholder: {},
      });
    });

    test("without attributes legacy", async () => {
      expect(UrlProcessor.getPlaceholderFromMatchLegacy([undefined, "query"])).toEqual({
        name: "query",
        placeholder: {},
      });
    });

    test("with attributes", async () => {
      expect(UrlProcessor.getPlaceholderFromMatch([undefined, "Start: { type: city}"])).toEqual({
        name: "Start",
        placeholder: {
          type: "city",
        },
      });
    });

    test("with attributes legacy", async () => {
      expect(UrlProcessor.getPlaceholderFromMatchLegacy([undefined, "Start|type=city"])).toEqual({
        name: "Start",
        placeholder: {
          type: "city",
        },
      });
    });
  });

  describe("processAttributeEncoding", () => {
    test("default", async () => {
      expect(UrlProcessor.processAttributeEncoding({}, "ÄÖÜäöü")).toEqual("%C3%84%C3%96%C3%9C%C3%A4%C3%B6%C3%BC");
    });

    test("iso-8859-1", async () => {
      expect(UrlProcessor.processAttributeEncoding({ encoding: "iso-8859-1" }, "ÄÖÜäöü")).toEqual("%C4%D6%DC%E4%F6%FC");
    });

    test("none", async () => {
      expect(UrlProcessor.processAttributeEncoding({ encoding: "none" }, "ÄÖÜäöü")).toEqual("ÄÖÜäöü");
    });
  });
});
