import child_process from "child_process";
import fs from "fs";
import jsyaml from "js-yaml";

import DataCompiler from "./DataCompiler";

jest.mock("child_process");
jest.mock("fs");
jest.mock("js-yaml");

describe("DataCompiler.getGitInfo", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test("reads git hash and date and returns a normalized commit object", () => {
    const execSyncMock = child_process.execSync as jest.Mock;
    execSyncMock
      .mockReturnValueOnce(Buffer.from("0123456789abcdef\n"))
      .mockReturnValueOnce(Buffer.from("2026-04-04 10:00:00 +0200\n"));

    expect(DataCompiler.getGitInfo()).toEqual({
      commit: {
        hash: "0123456",
        date: "2026-04-04 10:00:00 +0200",
      },
    });
    expect(execSyncMock).toHaveBeenNthCalledWith(1, "git rev-parse HEAD");
    expect(execSyncMock).toHaveBeenNthCalledWith(2, "git show -s --format=%ci");
  });
});

describe("DataCompiler.getConfig", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test("returns the default config when no local config file exists", () => {
    const readFileSyncMock = fs.readFileSync as jest.Mock;
    const existsSyncMock = fs.existsSync as jest.Mock;
    const loadMock = jsyaml.load as jest.Mock;

    readFileSyncMock.mockReturnValue("default-config");
    existsSyncMock.mockReturnValue(false);
    loadMock.mockReturnValue({ language: "en", country: "us" });

    expect(DataCompiler.getConfig()).toEqual({ language: "en", country: "us" });
    expect(readFileSyncMock).toHaveBeenCalledWith("trovu.config.default.yml", "utf8");
    expect(existsSyncMock).toHaveBeenCalledWith("trovu.config.yml");
    expect(loadMock).toHaveBeenCalledTimes(1);
  });

  test("merges the local config into the default config", () => {
    const readFileSyncMock = fs.readFileSync as jest.Mock;
    const existsSyncMock = fs.existsSync as jest.Mock;
    const loadMock = jsyaml.load as jest.Mock;

    readFileSyncMock.mockReturnValueOnce("default-config").mockReturnValueOnce("local-config");
    existsSyncMock.mockReturnValue(true);
    loadMock.mockReturnValueOnce({ language: "en", country: "us", debug: false }).mockReturnValueOnce({
      country: "de",
      debug: true,
    });

    expect(DataCompiler.getConfig()).toEqual({ language: "en", country: "de", debug: true });
    expect(readFileSyncMock).toHaveBeenNthCalledWith(1, "trovu.config.default.yml", "utf8");
    expect(readFileSyncMock).toHaveBeenNthCalledWith(2, "trovu.config.yml", "utf8");
    expect(loadMock).toHaveBeenCalledTimes(2);
  });
});
