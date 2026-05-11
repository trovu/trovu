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
    checkIfDeprecatedAlternativeHasMatchingPlaceholders: jest.fn(),
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
  const verifierDeprecatedAlternativeMock =
    ShortcutVerifier.checkIfDeprecatedAlternativeHasMatchingPlaceholders as jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
    readFileSyncMock.mockReturnValue("{}");
    loadYamlMock.mockImplementation((text: string) => {
      if (text === "{}") {
        return { type: "object", $id: "https://trovu.net/schema/test.yml" };
      }
      if (text === "default-config") {
        return { namespaces: ["o"], language: "en", country: "us" };
      }
      return { type: "object", $id: "https://trovu.net/schema/test.yml" };
    });
    addInfoMock.mockImplementation((shortcut, key, namespace) => ({
      ...shortcut,
      key,
      namespace,
    }));
    getArgumentsMock.mockReturnValue({ query: {} });
    verifierNoIncludeMock.mockReturnValue(undefined);
    verifierArgCountMock.mockReturnValue(undefined);
    verifierExampleArgCountMock.mockReturnValue(undefined);
    verifierDeprecatedAlternativeMock.mockReturnValue(undefined);
  });

  test("validates all shortcuts and enriches them before running verifiers", () => {
    const validateMock = jest.fn().mockReturnValue(true);
    const errorsTextMock = jest.fn().mockReturnValue("unused");
    AjvMock.mockImplementation(() => ({
      addSchema: jest.fn(),
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
    expect(readFileSyncMock).toHaveBeenCalledWith("schema/shortcuts.yml", "utf8");
    expect(validateMock).toHaveBeenCalledWith("https://trovu.net/schema/test.yml", {
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
    expect(verifierDeprecatedAlternativeMock).toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test("logs schema and verifier errors and exits with code 1 when validation fails", () => {
    const validateMock = jest.fn().mockReturnValue(false);
    const errorsTextMock = jest.fn().mockReturnValue("schema mismatch");
    AjvMock.mockImplementation(() => ({
      addSchema: jest.fn(),
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
    verifierDeprecatedAlternativeMock.mockReturnValue(
      'Mismatch in argumentCount of key and placeholders of deprecated alternative query in "de.gm 1".',
    );
    const exitSpy = jest.spyOn(process, "exit").mockImplementation((() => undefined) as never);
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    new Validator().validateShortcuts();

    expect(errorSpy).toHaveBeenNthCalledWith(1, "Problem in namespace de: schema mismatch");
    expect(errorSpy).toHaveBeenNthCalledWith(
      2,
      'Mismatch in argumentCount of key and arguments.length of url in "de.gm 1".',
    );
    expect(errorSpy).toHaveBeenNthCalledWith(
      3,
      'Mismatch in argumentCount of key and placeholders of deprecated alternative query in "de.gm 1".',
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test("validateConfig reports schema errors for trovu.config.default.yml", () => {
    const validateMock = jest.fn().mockReturnValue(false);
    const errorsTextMock = jest.fn().mockReturnValue("config mismatch");
    AjvMock.mockImplementation(() => ({
      addSchema: jest.fn(),
      validate: validateMock,
      errorsText: errorsTextMock,
    }));
    readFileSyncMock.mockImplementation((path: string) => {
      if (path === "trovu.config.default.yml") {
        return "default-config";
      }
      return "{}";
    });
    const exitSpy = jest.spyOn(process, "exit").mockImplementation((() => undefined) as never);
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    new Validator().validateConfig();

    expect(readFileSyncMock).toHaveBeenCalledWith("schema/config.yml", "utf8");
    expect(readFileSyncMock).toHaveBeenCalledWith("trovu.config.default.yml", "utf8");
    expect(errorSpy).toHaveBeenCalledWith("Problem in trovu.config.default.yml: config mismatch");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test("validateData validates config and shortcuts before exiting", () => {
    const validateMock = jest.fn().mockReturnValue(true);
    const errorsTextMock = jest.fn().mockReturnValue("unused");
    AjvMock.mockImplementation(() => ({
      addSchema: jest.fn(),
      validate: validateMock,
      errorsText: errorsTextMock,
    }));
    readFileSyncMock.mockImplementation((path: string) => {
      if (path === "trovu.config.default.yml") {
        return "default-config";
      }
      return "{}";
    });
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

    new Validator().validateData();

    expect(validateMock).toHaveBeenNthCalledWith(1, "https://trovu.net/schema/test.yml", {
      namespaces: ["o"], language: "en", country: "us",
    });
    expect(validateMock).toHaveBeenNthCalledWith(2, "https://trovu.net/schema/test.yml", {
      "gm 1": {
        url: "https://example.com/<query>",
      },
    });
    expect(exitSpy).not.toHaveBeenCalled();
  });
});
