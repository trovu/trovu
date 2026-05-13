import Validator from "./Validator";
import jsyaml from "js-yaml";

describe("Validator.validateResolvedNamespaces", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("passes a valid local include graph", () => {
    const data = jsyaml.load(`
      shortcuts:
        leo:
          de-fr 1:
            url: https://example.com/<query>
          fr-de 1:
            title: Französisch-Deutsch
            include:
              key: de-fr 1
      types:
        city: {}
        date: {}
    `);

    expect(new Validator().validateResolvedNamespaces(false, data)).toBe(false);
  });

  test("fails a local include loop", () => {
    const data = jsyaml.load(`
      shortcuts:
        leo:
          tic 1:
            include:
              key: tac 1
          tac 1:
            include:
              key: toe 1
          toe 1:
            include:
              key: tic 1
      types:
        city: {}
        date: {}
    `);
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    expect(new Validator().validateResolvedNamespaces(false, data)).toBe(true);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Problem resolving local namespaces for language en: processInclude: Loop ran already 10 times."),
    );
  });

  test("checks languages derived from language-dependent include targets", () => {
    const data = jsyaml.load(`
      shortcuts:
        leo:
          fr-en 1:
            url: https://example.com/<query>
          fr-fr 1:
            include:
              key: fr 1
          fr 1:
            include:
              key: fr-<$language> 1
      types:
        city: {}
        date: {}
    `);
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    expect(new Validator().validateResolvedNamespaces(false, data)).toBe(true);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Problem resolving local namespaces for language fr: processInclude: Loop ran already 10 times."),
    );
  });
});
