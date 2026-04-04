import GitLogger from "./GitLogger";

describe("GitLogger", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("getVersion returns the short version string", () => {
    const logger = new GitLogger({
      commit: {
        hash: "abcdef1",
        date: "2026-04-04 10:00:00 +0200",
      },
    });

    expect(logger.getVersion()).toBe("abcdef1 2026-04-04 10:00:00 +0200");
  });

  test("logVersion writes the formatted version to the console", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
    const logger = new GitLogger({
      commit: {
        hash: "abcdef1",
        date: "2026-04-04 10:00:00 +0200",
      },
    });

    logger.logVersion();

    expect(consoleSpy).toHaveBeenCalledWith("Trovu running version", "abcdef1 2026-04-04 10:00:00 +0200");
  });
});
