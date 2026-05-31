import Helper from "./Helper";

describe("Helper.fetchAsync", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test("returns text and logs success for a 200 response", async () => {
    const logger = {
      info: jest.fn(),
      success: jest.fn(),
    };
    const response = {
      status: 200,
      text: jest.fn().mockResolvedValue("payload"),
    };
    global.fetch = jest.fn().mockResolvedValue(response as unknown as Response);

    const text = await Helper.fetchAsync("https://example.com/file.txt", { reload: true, logger });

    expect(global.fetch).toHaveBeenCalledWith("https://example.com/file.txt", {
      cache: "reload",
    });
    expect(text).toBe("payload");
    expect(response.text).toHaveBeenCalled();
    expect(logger.success).toHaveBeenCalledWith("Success fetching via reload https://example.com/file.txt");
    expect(logger.info).not.toHaveBeenCalled();
  });

  test("returns null and logs info for a non-200 response", async () => {
    const logger = {
      info: jest.fn(),
      success: jest.fn(),
    };
    global.fetch = jest.fn().mockResolvedValue({
      status: 404,
      text: jest.fn(),
    } as unknown as Response);

    const text = await Helper.fetchAsync("https://example.com/missing.txt", { reload: false, logger }, { catchErrors: true });

    expect(global.fetch).toHaveBeenCalledWith("https://example.com/missing.txt", {
      cache: "force-cache",
    });
    expect(text).toBeNull();
    expect(logger.info).toHaveBeenCalledWith("Problem fetching via force-cache https://example.com/missing.txt: 404");
    expect(logger.success).not.toHaveBeenCalled();
  });

  test("returns null and logs a warning for a network error", async () => {
    const logger = {
      info: jest.fn(),
      success: jest.fn(),
      warning: jest.fn(),
    };
    global.fetch = jest.fn().mockRejectedValue(new Error("offline"));

    const text = await Helper.fetchAsync(
      "https://example.com/missing.txt",
      { reload: false, logger },
      { catchErrors: true },
    );

    expect(text).toBeNull();
    expect(logger.warning).toHaveBeenCalledWith("Problem fetching via force-cache https://example.com/missing.txt: offline");
  });

  test("aborts a request after the configured timeout", async () => {
    jest.useFakeTimers();
    const logger = {
      info: jest.fn(),
      success: jest.fn(),
      warning: jest.fn(),
    };
    global.fetch = jest.fn((_url, options) => {
      return new Promise((_resolve, reject) => {
        options.signal.addEventListener("abort", () => reject(new Error("aborted")));
      });
    });

    const textPromise = Helper.fetchAsync(
      "https://example.com/slow.txt",
      { reload: false, logger },
      { catchErrors: true, timeout: 5000 },
    );
    jest.advanceTimersByTime(5000);

    await expect(textPromise).resolves.toBeNull();
    expect(logger.warning).toHaveBeenCalledWith("Problem fetching via force-cache https://example.com/slow.txt: aborted");
  });
});
