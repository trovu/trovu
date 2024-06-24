import Env from './Env.js';
import NamespaceFetcher from './NamespaceFetcher.js';
import jsyaml from 'js-yaml';

function cloneObject(obj) {
  return JSON.parse(JSON.stringify(obj));
}

describe('NamespaceFetcher.getInitialNamespaceInfo', () => {
  test('site', () => {
    const env = new Env();
    expect(new NamespaceFetcher(env).getInitialNamespaceInfo('de')).toEqual({
      name: 'de',
    });
  });
  test('github, this user', () => {
    const env = new Env({ github: 'johndoe' });
    expect(
      new NamespaceFetcher(env).getInitialNamespaceInfo({ github: '.' }),
    ).toEqual({
      name: 'johndoe',
      github: 'johndoe',
    });
  });
  test('github, named user', () => {
    const env = new Env();
    expect(
      new NamespaceFetcher(env).getInitialNamespaceInfo({ github: 'johndoe' }),
    ).toEqual({
      name: 'johndoe',
      github: 'johndoe',
    });
  });
  test('name and github', () => {
    const env = new Env();
    expect(
      new NamespaceFetcher(env).getInitialNamespaceInfo({
        github: 'johndoe',
        name: 'myjohndoe',
      }),
    ).toEqual({
      github: 'johndoe',
      name: 'myjohndoe',
    });
  });
  test('configUrl, this user (negative)', () => {
    const env = new Env();
    expect(
      new NamespaceFetcher(env).getInitialNamespaceInfo({ github: '.' }),
    ).toEqual(false);
  });
  test('name and url', () => {
    const env = new Env();
    expect(
      new NamespaceFetcher(env).getInitialNamespaceInfo({
        name: 'johndoe',
        url: 'https://johndoe.com/trovu-data-user/shortcuts.yml',
      }),
    ).toEqual({
      name: 'johndoe',
      url: 'https://johndoe.com/trovu-data-user/shortcuts.yml',
    });
  });
  test('name and shortcuts', () => {
    const env = new Env();
    expect(
      new NamespaceFetcher(env).getInitialNamespaceInfo({
        name: 'johndoe',
        shortcuts: {
          'example 0': {
            url: 'https://example.com/',
          },
        },
      }),
    ).toEqual({
      name: 'johndoe',
      shortcuts: {
        'example 0': {
          url: 'https://example.com/',
        },
      },
    });
  });
  test('only url (negative)', () => {
    const env = new Env();
    expect(
      new NamespaceFetcher(env).getInitialNamespaceInfo({
        url: 'https://johndoe.com/trovu-data-user/',
      }),
    ).toEqual(false);
  });
  test('only shortcuts (negative)', () => {
    const env = new Env();
    expect(
      new NamespaceFetcher(env).getInitialNamespaceInfo({
        shortcuts: {},
      }),
    ).toEqual(false);
  });
  test('name and shortcuts, short notation', () => {
    const env = new Env();
    expect(
      new NamespaceFetcher(env).getInitialNamespaceInfo({
        name: 'johndoe',
        shortcuts: {
          'example 0': 'https://example.com/',
        },
      }),
    ).toEqual({
      name: 'johndoe',
      shortcuts: {
        'example 0': 'https://example.com/',
      },
    });
  });
});
describe('NamespaceFetcher.processShortcuts', () => {
  test('convertToObject', () => {
    expect(
      new NamespaceFetcher(new Env()).processShortcuts(
        { 'foo 0': 'https://example.com/' },
        'testNamespace',
      ),
    ).toEqual({ 'foo 0': { url: 'https://example.com/' } });
  });
  test('convertIncludeToObject', () => {
    expect(
      new NamespaceFetcher(new Env()).processShortcuts(
        { 'foo 0': { include: 'bar 0' } },
        'testNamespace',
      ),
    ).toEqual({ 'foo 0': { include: { key: 'bar 0' } } });
  });
});

describe('NamespaceFetcher.addNamespaceInfo', () => {
  test('site', () => {
    const env = new Env();
    expect(
      new NamespaceFetcher(env).addNamespaceInfo({
        name: 'de',
        shortcuts: true,
      }),
    ).toEqual({
      name: 'de',
      shortcuts: true,
      type: 'site',
    });
  });
  test('github', () => {
    const env = new Env();
    expect(
      new NamespaceFetcher(env).addNamespaceInfo({ name: 'johndoe' }),
    ).toEqual({
      github: 'johndoe',
      name: 'johndoe',
      type: 'user',
      url: `https://raw.githubusercontent.com/johndoe/trovu-data-user/master/shortcuts.yml?${env.commitHash}`,
    });
  });
  test('name and url', () => {
    const env = new Env();
    expect(
      new NamespaceFetcher(env).addNamespaceInfo({
        name: 'johndoe',
        url: 'https://example.com/shortcuts.yml',
      }),
    ).toEqual({
      name: 'johndoe',
      type: 'user',
      url: 'https://example.com/shortcuts.yml',
    });
  });
  test('name', () => {
    const env = new Env();
    expect(
      new NamespaceFetcher(env).addNamespaceInfo({
        name: 'johndoe',
      }),
    ).toEqual({
      name: 'johndoe',
      github: 'johndoe',
      type: 'user',
      url: 'https://raw.githubusercontent.com/johndoe/trovu-data-user/master/shortcuts.yml?unknown',
    });
  });
});

describe('NamespaceFetcher.processInclude', () => {
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

  test('1 level', () => {
    const shortcut = jsyaml.load(`
    include:
      key: de-fr 1
    `);
    expect(
      new NamespaceFetcher(new Env()).processInclude(
        shortcut,
        'leo',
        cloneObject(namespaceInfos),
      ),
    ).toMatchObject({
      url: 'https://dict.leo.org/französisch-deutsch/{%word}',
      title: 'Allemand-Français (leo.org)',
    });
  });

  test('2 level', () => {
    const shortcut = jsyaml.load(`
    include:
      key: fr-de 1
      namespace: leo
  `);
    expect(
      new NamespaceFetcher(new Env()).processInclude(
        shortcut,
        '',
        cloneObject(namespaceInfos),
      ),
    ).toMatchObject({
      url: 'https://dict.leo.org/französisch-deutsch/{%word}',
      title: 'Französisch-Deutsch (leo.org)',
    });
  });

  test('with variable', () => {
    const shortcut = jsyaml.load(`
    include:
      key: fr-{$language} 1
    `);
    expect(
      new NamespaceFetcher(new Env({ language: 'de' })).processInclude(
        shortcut,
        'leo',
        cloneObject(namespaceInfos),
      ),
    ).toMatchObject({
      url: 'https://dict.leo.org/französisch-deutsch/{%word}',
      title: 'Französisch-Deutsch (leo.org)',
    });
  });

  test('with loop (negative)', () => {
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
      new NamespaceFetcher(new Env({})).processInclude(
        shortcut,
        'leo',
        namespaceInfosLoop,
      );
    }).toThrow(Error);
  });

  test('faulty (negative)', () => {
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
      new NamespaceFetcher(new Env({})).processInclude(
        shortcut,
        'leo',
        namespaceInfos,
      );
    }).toThrow(Error);
  });

  test('multiple', () => {
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
      new NamespaceFetcher(new Env({ language: 'de' })).processInclude(
        shortcut,
        'o',
        namespaceInfosMultiple,
      ),
    ).toMatchObject({
      title: 'Französisch-Deutsch (leo.org)',
      url: 'https://dict.leo.org/französisch-deutsch/{%word}',
    });
  });
});

describe('NamespaceFetcher.addReachable', () => {
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

  test('standard', () => {
    expect(
      new NamespaceFetcher(new Env({})).addReachable(namespaceInfos),
    ).toEqual(
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

describe('NamespaceFetcher.addInfo', () => {
  test('standard', () => {
    expect(
      new NamespaceFetcher(new Env({})).addInfo(
        {
          url: 'https://reiseauskunft.bahn.de/bin/query.exe/d?S=<Start: {type: city}>&Z=<Ziel>&timesel=depart&start=1',
        },
        'db 2',
        '.de',
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
