import ShortcutFinder from "./ShortcutFinder";

describe("ShortcutFinder.matchShortcuts", () => {
  test("returns the first reachable shortcut for the requested keyword and argument count", () => {
    const shortcut = { reachable: true, url: "https://example.com" };
    const namespaceInfos = {
      aa: { shortcuts: { "gm 1": shortcut } },
      bb: { shortcuts: { "gm 1": { reachable: true, url: "https://ignored.example.com" } } },
    };

    expect(ShortcutFinder.matchShortcuts("gm", ["berlin"], namespaceInfos)).toBe(shortcut);
  });

  test("skips non-reachable shortcuts unless explicitly included", () => {
    const shortcut = { reachable: false, url: "https://example.com" };
    const namespaceInfos = {
      aa: { shortcuts: { "gm 1": shortcut } },
    };

    expect(ShortcutFinder.matchShortcuts("gm", ["berlin"], namespaceInfos)).toBeUndefined();
    expect(ShortcutFinder.matchShortcuts("gm", ["berlin"], namespaceInfos, true)).toBe(shortcut);
  });
});

describe("ShortcutFinder.findShortcut", () => {
  test("falls back to the whole argument string when comma-splitting misses a shortcut", () => {
    const logger = { info: jest.fn() };
    const shortcut = { reachable: true, url: "https://example.com" };
    const env = {
      keyword: "gm",
      args: ["Berlin", "Germany"],
      argumentString: "Berlin, Germany",
      query: "gm Berlin, Germany",
      defaultKeyword: "",
      namespaceInfos: {
        aa: {
          shortcuts: {
            "gm 1": shortcut,
          },
        },
      },
      logger,
    };

    expect(ShortcutFinder.findShortcut(env)).toBe(shortcut);
    expect(env.args).toEqual(["Berlin, Germany"]);
    expect(logger.info).toHaveBeenCalledWith(
      "No shortcut found for gm 2 yet. Trying with the whole argument string as the only argument.",
    );
  });

  test("falls back to the default keyword using the full query", () => {
    const logger = { info: jest.fn() };
    const shortcut = { reachable: true, url: "https://example.com" };
    const env = {
      keyword: "unknown",
      args: [],
      argumentString: "",
      query: "berlin wall",
      defaultKeyword: "w",
      namespaceInfos: {
        aa: {
          shortcuts: {
            "w 1": shortcut,
          },
        },
      },
      logger,
    };

    expect(ShortcutFinder.findShortcut(env)).toBe(shortcut);
    expect(env.args).toEqual(["berlin wall"]);
    expect(logger.info).toHaveBeenCalledWith("No shortcut found for unknown 0 yet. Trying with default keyword.");
  });

  test("finally returns a non-reachable shortcut so the caller can inform the user", () => {
    const logger = { info: jest.fn() };
    const shortcut = { reachable: false, url: "https://example.com" };
    const env = {
      keyword: "gm",
      args: ["berlin"],
      argumentString: "berlin",
      query: "gm berlin",
      defaultKeyword: "",
      namespaceInfos: {
        aa: {
          shortcuts: {
            "gm 1": shortcut,
          },
        },
      },
      logger,
    };

    expect(ShortcutFinder.findShortcut(env)).toBe(shortcut);
    expect(logger.info).toHaveBeenCalledWith("No shortcut found for gm 1 yet. Trying with non-reachable.");
  });
});
