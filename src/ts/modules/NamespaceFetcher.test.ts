import Env from "./Env";
import NamespaceFetcher from "./NamespaceFetcher";
import { createLogger } from "../../../tests/createLogger";
import jsyaml from "js-yaml";

function cloneObject(obj) {
  return JSON.parse(JSON.stringify(obj));
}

describe("NamespaceFetcher.getInitialNamespaceInfo", () => {
  test("site", () => {
    const env = new Env();
    expect(new NamespaceFetcher(env).getInitialNamespaceInfo("de")).toEqual({
      name: "de",
    });
  });
  test("github, this user", () => {
    const env = new Env({ github: "johndoe" });
    expect(new NamespaceFetcher(env).getInitialNamespaceInfo({ github: "." })).toEqual({
      name: "johndoe",
      github: "johndoe",
    });
  });
  test("github, named user", () => {
    const env = new Env();
    expect(new NamespaceFetcher(env).getInitialNamespaceInfo({ github: "johndoe" })).toEqual({
      name: "johndoe",
      github: "johndoe",
    });
  });
  test("name and github", () => {
    const env = new Env();
    expect(
      new NamespaceFetcher(env).getInitialNamespaceInfo({
        github: "johndoe",
        name: "myjohndoe",
      }),
    ).toEqual({
      github: "johndoe",
      name: "myjohndoe",
    });
  });
  test("configUrl, this user (negative)", () => {
    const logger = createLogger();
    expect(new NamespaceFetcher({ logger }).getInitialNamespaceInfo({ github: "." })).toEqual(false);
    expect(logger.warning).toHaveBeenCalledWith(
      'Invalid namespace: {"github":"."} provided without a github repository name.',
    );
  });
  test("name and url", () => {
    const env = new Env();
    expect(
      new NamespaceFetcher(env).getInitialNamespaceInfo({
        name: "johndoe",
        url: "https://johndoe.com/trovu-data-user/shortcuts.yml",
      }),
    ).toEqual({
      name: "johndoe",
      url: "https://johndoe.com/trovu-data-user/shortcuts.yml",
    });
  });
  test("name and shortcuts", () => {
    const env = new Env();
    expect(
      new NamespaceFetcher(env).getInitialNamespaceInfo({
        name: "johndoe",
        shortcuts: {
          "example 0": {
            url: "https://example.com/",
          },
        },
      }),
    ).toEqual({
      name: "johndoe",
      shortcuts: {
        "example 0": {
          url: "https://example.com/",
        },
      },
    });
  });
  test("only url (negative)", () => {
    const logger = createLogger();
    expect(
      new NamespaceFetcher({ logger }).getInitialNamespaceInfo({
        url: "https://johndoe.com/trovu-data-user/",
      }),
    ).toEqual(false);
    expect(logger.warning).toHaveBeenCalledWith(
      'Invalid namespace: {"url":"https://johndoe.com/trovu-data-user/"} provided without a name.',
    );
  });
  test("only shortcuts (negative)", () => {
    const logger = createLogger();
    expect(
      new NamespaceFetcher({ logger }).getInitialNamespaceInfo({
        shortcuts: {},
      }),
    ).toEqual(false);
    expect(logger.warning).toHaveBeenCalledWith('Invalid namespace: {"shortcuts":{}} provided without a name.');
  });
  test("name and shortcuts, short notation", () => {
    const env = new Env();
    expect(
      new NamespaceFetcher(env).getInitialNamespaceInfo({
        name: "johndoe",
        shortcuts: {
          "example 0": "https://example.com/",
        },
      }),
    ).toEqual({
      name: "johndoe",
      shortcuts: {
        "example 0": "https://example.com/",
      },
    });
  });
});
describe("NamespaceFetcher.processShortcuts", () => {
  test("convertToObject", () => {
    expect(
      new NamespaceFetcher(new Env()).processShortcuts({ "foo 0": "https://example.com/" }, "testNamespace"),
    ).toEqual({ "foo 0": { url: "https://example.com/" } });
  });
  test("convertIncludeToObject", () => {
    expect(
      new NamespaceFetcher(new Env()).processShortcuts({ "foo 0": { include: "bar 0" } }, "testNamespace"),
    ).toEqual({ "foo 0": { include: { key: "bar 0" } } });
  });
});

describe("NamespaceFetcher.addNamespaceInfo", () => {
  test("site", () => {
    const env = new Env();
    expect(
      new NamespaceFetcher(env).addNamespaceInfo({
        name: "de",
        shortcuts: {},
      }),
    ).toEqual({
      name: "de",
      shortcuts: {},
      type: "site",
    });
  });
  test("github", () => {
    const env = new Env();
    expect(new NamespaceFetcher(env).addNamespaceInfo({ name: "johndoe" })).toEqual({
      github: "johndoe",
      name: "johndoe",
      type: "user",
      url: "https://raw.githubusercontent.com/johndoe/trovu-data-user/master/shortcuts.yml",
    });
  });
  test("name and url", () => {
    const env = new Env();
    expect(
      new NamespaceFetcher(env).addNamespaceInfo({
        name: "johndoe",
        url: "https://example.com/shortcuts.yml",
      }),
    ).toEqual({
      name: "johndoe",
      type: "user",
      url: "https://example.com/shortcuts.yml",
    });
  });
  test("name", () => {
    const env = new Env();
    expect(
      new NamespaceFetcher(env).addNamespaceInfo({
        name: "johndoe",
      }),
    ).toEqual({
      name: "johndoe",
      github: "johndoe",
      type: "user",
      url: "https://raw.githubusercontent.com/johndoe/trovu-data-user/master/shortcuts.yml",
    });
  });
});

describe("NamespaceFetcher.fetchNamespaceInfos", () => {
  test("continues with an empty namespace after a network error", async () => {
    const logger = createLogger();
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error("offline"));
    const fetcher = new NamespaceFetcher({ logger });
    const namespaceInfos = {
      johndoe: {
        name: "johndoe",
        type: "user" as const,
        url: "https://example.com/shortcuts.yml",
      },
    };

    await expect(fetcher.fetchNamespaceInfos(namespaceInfos)).resolves.toEqual({
      johndoe: {
        ...namespaceInfos.johndoe,
        shortcuts: {},
      },
    });
    expect(logger.warning).toHaveBeenCalledWith(
      "Problem fetching via default https://example.com/shortcuts.yml: offline",
    );
    global.fetch = originalFetch;
  });

  test("with endless new user namespaces (negative)", async () => {
    const logger = createLogger();
    const fetcher = new NamespaceFetcher({ logger });
    const namespaceInfos = {
      loop0: {
        name: "loop0",
        type: "user" as const,
        url: "https://example.com/loop0.yml",
      },
    };
    fetcher.namespaceInfos = namespaceInfos;
    jest.spyOn(fetcher, "startFetches").mockReturnValue([]);
    jest.spyOn(fetcher, "processResponses").mockImplementation(async (newNamespaceInfos) => {
      for (const namespaceInfo of newNamespaceInfos) {
        const nextIndex = Object.keys(fetcher.namespaceInfos).length;
        namespaceInfo.shortcuts = fetcher.processShortcuts(
          {
            "foo 0": {
              include: {
                key: "bar 0",
                namespace: `loop${nextIndex}`,
              },
            },
          },
          namespaceInfo.name,
        );
      }
      return newNamespaceInfos;
    });

    await expect(fetcher.fetchNamespaceInfos(namespaceInfos)).rejects.toThrow(
      "fetchNamespaceInfos: Loop ran already 10 times.",
    );
    expect(logger.error).toHaveBeenCalledWith("fetchNamespaceInfos: Loop ran already 10 times.");
  });
});

describe("NamespaceFetcher.processInclude", () => {
  const namespaceInfos = jsyaml.load(`
    leo:
      shortcuts:
        de-fr 1:
          url: https://dict.leo.org/französisch-deutsch/{%word}
          title: Allemand-Français (leo.org)
        fr-de 1:
          title: Französisch-Deutsch (leo.org)
          include:
            key: de-fr 1
  `);

  test("1 level", () => {
    const shortcut = jsyaml.load(`
    include:
      key: de-fr 1
    `);
    expect(new NamespaceFetcher(new Env()).processInclude(shortcut, "leo", cloneObject(namespaceInfos))).toMatchObject({
      url: "https://dict.leo.org/französisch-deutsch/{%word}",
      title: "Allemand-Français (leo.org)",
    });
  });

  test("2 level", () => {
    const shortcut = jsyaml.load(`
    include:
      key: fr-de 1
      namespace: leo
  `);
    expect(new NamespaceFetcher(new Env()).processInclude(shortcut, "", cloneObject(namespaceInfos))).toMatchObject({
      url: "https://dict.leo.org/französisch-deutsch/{%word}",
      title: "Französisch-Deutsch (leo.org)",
    });
  });

  test("with variable", () => {
    const shortcut = jsyaml.load(`
    include:
      key: fr-{$language} 1
    `);
    expect(
      new NamespaceFetcher(new Env({ language: "de" })).processInclude(shortcut, "leo", cloneObject(namespaceInfos)),
    ).toMatchObject({
      url: "https://dict.leo.org/französisch-deutsch/{%word}",
      title: "Französisch-Deutsch (leo.org)",
    });
  });

  test("with loop (negative)", () => {
    const logger = createLogger();
    const namespaceInfosLoop = jsyaml.load(`
      leo:
        shortcuts:
          tic 1:
            include:
              key: tac 1
          tac 1:
            include:
              key: toe 1
          toe 1:
            include:
              key: tic 1
    `);
    const shortcut = jsyaml.load(`
    include:
      key: tic 1
    `);
    expect(() => {
      new NamespaceFetcher({ logger }).processInclude(shortcut, "leo", namespaceInfosLoop);
    }).toThrow(Error);
    expect(logger.error).toHaveBeenCalledWith("processInclude: Loop ran already 10 times.");
  });

  test("faulty (negative)", () => {
    const logger = createLogger();
    const namespaceInfos = jsyaml.load(`
      leo:
        shortcuts:
          tic 1:
            url: https://example.com/{%query}
    `);
    const shortcut = jsyaml.load(`
    include: tic 1
    `);
    expect(() => {
      new NamespaceFetcher({ logger }).processInclude(shortcut, "leo", namespaceInfos);
    }).toThrow(Error);
    expect(logger.error).toHaveBeenCalledWith('Include with missing key at: "tic 1"');
  });

  test("multiple", () => {
    const logger = createLogger();
    const namespaceInfosMultiple = jsyaml.load(`
      leo:
        shortcuts:
          de-fr 1:
            url: https://dict.leo.org/französisch-deutsch/{%word}
            title: Allemand-Français (leo.org)
          fr-de 1:
            title: Französisch-Deutsch (leo.org)
            include:
              key: de-fr 1
          fr 1:
            include:
              key: fr-{$language} 1
    `);
    const shortcut = jsyaml.load(`
    include:
    - key: fr 1
      namespace: lge
    - key: fr 1
      namespace: leo
    `);
    expect(
      new NamespaceFetcher({ language: "de", logger }).processInclude(shortcut, "o", namespaceInfosMultiple),
    ).toMatchObject({
      title: "Französisch-Deutsch (leo.org)",
      url: "https://dict.leo.org/französisch-deutsch/{%word}",
    });
    expect(logger.warning).toHaveBeenCalledWith('Namespace "lge" does not exist or has no shortcuts.');
  });
});

describe("NamespaceFetcher.addReachable", () => {
  const namespaceInfos = jsyaml.load(`
    o:
      priority: 1
      shortcuts:
        eo 1:
          title: Esperanto dictionary
    de:
      priority: 2
      shortcuts:
        eo 1:
          title: Esperanto-Wörterbuch
  `);

  test("standard", () => {
    expect(new NamespaceFetcher(new Env({})).addReachable(namespaceInfos)).toEqual(
      jsyaml.load(`
        o:
          priority: 1
          shortcuts:
            eo 1:
              title: Esperanto dictionary
              reachable: false
        de:
          priority: 2
          shortcuts:
            eo 1:
              title: Esperanto-Wörterbuch
              reachable: true
      `),
    );
  });
});

describe("NamespaceFetcher.addInfo", () => {
  test("standard", () => {
    expect(
      NamespaceFetcher.addInfo(
        {
          url: "https://reiseauskunft.bahn.de/bin/query.exe/d?S=<Start: {type: city}>&Z=<Ziel>&timesel=depart&start=1",
        },
        "db 2",
        ".de",
      ),
    ).toEqual(
      jsyaml.load(`
        url: 'https://reiseauskunft.bahn.de/bin/query.exe/d?S=<Start: {type: city}>&Z=<Ziel>&timesel=depart&start=1'
        key: db 2
        keyword: db
        argumentCount: 2
        argumentString: 🏙️ Start, Ziel
        namespace: .de
        arguments:
          Start:
            '<Start: {type: city}>': { type: city }
          Ziel:
            '<Ziel>': {}
        title: '' 
    `),
    );
  });
});
