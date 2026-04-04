import Logger from "./Logger";

describe("Logger", () => {
  test("basic", () => {
    const logger = new Logger();
    logger.info("an info message");
    logger.warning("a warning message");
    logger.success("a success message");
    expect(logger.logs.length).toEqual(3);
  });
});
