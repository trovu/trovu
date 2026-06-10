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
      expect(UrlProcessor.getPlaceholderFromMatch([undefined, "query"] as unknown as RegExpExecArray)).toEqual({
        name: "query",
        placeholder: {},
      });
    });

    test("without attributes legacy", async () => {
      expect(UrlProcessor.getPlaceholderFromMatchLegacy([undefined, "query"] as unknown as RegExpExecArray)).toEqual({
        name: "query",
        placeholder: {},
      });
    });

    test("with attributes", async () => {
      expect(
        UrlProcessor.getPlaceholderFromMatch([undefined, "Start: { type: city}"] as unknown as RegExpExecArray),
      ).toEqual({
        name: "Start",
        placeholder: {
          type: "city",
        },
      });
    });

    test("with attributes legacy", async () => {
      expect(
        UrlProcessor.getPlaceholderFromMatchLegacy([undefined, "Start|type=city"] as unknown as RegExpExecArray),
      ).toEqual({
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

    test("iso-8859-1 encodes reserved ASCII characters", async () => {
      expect(UrlProcessor.processAttributeEncoding({ encoding: "iso-8859-1" }, "a+b/c@d")).toEqual("a%2Bb%2Fc%40d");
    });

    test("iso-8859-1 encodes latin1 words", async () => {
      expect(UrlProcessor.processAttributeEncoding({ encoding: "iso-8859-1" }, "café")).toEqual("caf%E9");
    });

    test("iso-8859-1 replaces unsupported characters with question marks", async () => {
      expect(UrlProcessor.processAttributeEncoding({ encoding: "iso-8859-1" }, "€")).toEqual("%3F");
    });

    test("none", async () => {
      expect(UrlProcessor.processAttributeEncoding({ encoding: "none" }, "ÄÖÜäöü")).toEqual("ÄÖÜäöü");
    });
  });

  describe("processTypeTime", () => {
    test("formats a valid time", () => {
      expect(UrlProcessor.processTypeTime("8:15", { output: "HH-mm" })).toBe("08-15");
    });

    test("keeps an invalid time unchanged", () => {
      expect(UrlProcessor.processTypeTime("soon", {})).toBe("soon");
    });
  });

  describe("replaceArguments", () => {
    test("processes time placeholders before encoding", () => {
      expect(
        UrlProcessor.replaceArguments("https://example.com/?time=<time: {type: time, output: HH-mm}>", ["8:15"], {
          country: "de",
          data: {},
          language: "de",
        }),
      ).toBe("https://example.com/?time=08-15");
    });
  });
});
