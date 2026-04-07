import Logger from "./Logger";

describe("Logger", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("basic", () => {
    const consoleInfoSpy = jest.spyOn(console, "info").mockImplementation(() => undefined);
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
    const logger = new Logger();
    logger.info("an info message");
    logger.warning("a warning message");
    logger.success("a success message");
    expect(logger.logs.length).toEqual(3);
    expect(consoleInfoSpy).not.toHaveBeenCalled();
    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith("a warning message");
  });

  test("supports verbose console logging when enabled", () => {
    const consoleInfoSpy = jest.spyOn(console, "info").mockImplementation(() => undefined);
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
    const logger = new Logger("", {
      consoleLevels: ["info", "success", "warning", "error"],
    });

    logger.info("an info message");
    logger.success("a success message");

    expect(consoleInfoSpy).toHaveBeenCalledWith("an info message");
    expect(consoleLogSpy).toHaveBeenCalledWith("a success message");
  });
});
