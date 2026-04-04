import ajv from "ajv";
import fs from "fs";
import jsyaml from "js-yaml";

import DataManager from "./DataManager";
import NamespaceFetcher from "./NamespaceFetcher";
import ShortcutVerifier from "./ShortcutVerifier";
import UrlProcessor from "./UrlProcessor";
import Validator from "./Validator";

jest.mock("ajv", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("fs", () => ({
  __esModule: true,
  default: {
    readFileSync: jest.fn(),
  },
}));

jest.mock("js-yaml", () => ({
  __esModule: true,
  default: {
    load: jest.fn(),
  },
}));

jest.mock("./DataManager", () => ({
  __esModule: true,
  default: {
    load: jest.fn(),
  },
}));

jest.mock("./NamespaceFetcher", () => ({
  __esModule: true,
  default: {
    addInfo: jest.fn(),
  },
}));

jest.mock("./UrlProcessor", () => ({
  __esModule: true,
  default: {
    getArgumentsFromString: jest.fn(),
  },
}));

jest.mock("./ShortcutVerifier", () => ({
  __esModule: true,
  default: {
    checkIfHasUrlAndNoInclude: jest.fn(),
    checkIfArgCountMatches: jest.fn(),
    checkIfArgCountMatchesWithExamples: jest.fn(),
  },
}));

describe("Validator.validateShortcuts", () => {
  const AjvMock = ajv as unknown as jest.Mock;
  const readFileSyncMock = fs.readFileSync as jest.Mock;
  const loadYamlMock = jsyaml.load as jest.Mock;
  const loadDataMock = DataManager.load as jest.Mock;
  const addInfoMock = NamespaceFetcher.addInfo as jest.Mock;
  const getArgumentsMock = UrlProcessor.getArgumentsFromString as jest.Mock;
  const verifierNoIncludeMock = ShortcutVerifier.checkIfHasUrlAndNoInclude as jest.Mock;
  const verifierArgCountMock = ShortcutVerifier.checkIfArgCountMatches as jest.Mock;
  const verifierExampleArgCountMock = ShortcutVerifier.checkIfArgCountMatchesWithExamples as jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
    readFileSyncMock.mockReturnValue("schema");
    loadYamlMock.mockReturnValue({ type: "object" });
    addInfoMock.mockImplementation((shortcut, key, namespace) => ({
      ...shortcut,
      key,
      namespace,
    }));
    getArgumentsMock.mockReturnValue({ query: {} });
    verifierNoIncludeMock.mockReturnValue(undefined);
    verifierArgCountMock.mockReturnValue(undefined);
    verifierExampleArgCountMock.mockReturnValue(undefined);
  });

  test("validates all shortcuts and enriches them before running verifiers", () => {
    const validateMock = jest.fn().mockReturnValue(true);
    const errorsTextMock = jest.fn().mockReturnValue("unused");
    AjvMock.mockImplementation(() => ({
      validate: validateMock,
      errorsText: errorsTextMock,
    }));
    loadDataMock.mockReturnValue({
      shortcuts: {
        de: {
          "gm 1": {
            url: "https://example.com/<query>",
          },
        },
      },
    });
    const exitSpy = jest.spyOn(process, "exit").mockImplementation((() => undefined) as never);
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    new Validator().validateShortcuts();

    expect(AjvMock).toHaveBeenCalledWith({ strict: true });
    expect(readFileSyncMock).toHaveBeenCalledWith("data/schema/shortcuts.yml");
    expect(validateMock).toHaveBeenCalledWith({ type: "object" }, {
      "gm 1": {
        url: "https://example.com/<query>",
      },
    });
    expect(addInfoMock).toHaveBeenCalledWith(
      {
        url: "https://example.com/<query>",
      },
      "gm 1",
      "de",
    );
    expect(getArgumentsMock).toHaveBeenCalledWith("https://example.com/<query>");
    expect(verifierNoIncludeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        namespace: "de",
        key: "gm 1",
        keyword: "gm",
        argumentCount: "1",
        arguments: { query: {} },
      }),
    );
    expect(verifierArgCountMock).toHaveBeenCalled();
    expect(verifierExampleArgCountMock).toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test("logs schema and verifier errors and exits with code 1 when validation fails", () => {
    const validateMock = jest.fn().mockReturnValue(false);
    const errorsTextMock = jest.fn().mockReturnValue("schema mismatch");
    AjvMock.mockImplementation(() => ({
      validate: validateMock,
      errorsText: errorsTextMock,
    }));
    loadDataMock.mockReturnValue({
      shortcuts: {
        de: {
          "gm 1": {
            url: "https://example.com/<query>",
          },
        },
      },
    });
    verifierArgCountMock.mockReturnValue('Mismatch in argumentCount of key and arguments.length of url in "de.gm 1".');
    const exitSpy = jest.spyOn(process, "exit").mockImplementation((() => undefined) as never);
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    new Validator().validateShortcuts();

    expect(errorSpy).toHaveBeenNthCalledWith(1, "Problem in namespace de: schema mismatch");
    expect(errorSpy).toHaveBeenNthCalledWith(
      2,
      'Mismatch in argumentCount of key and arguments.length of url in "de.gm 1".',
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
