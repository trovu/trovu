import NamespaceFetcher from './NamespaceFetcher.js';
import jsyaml from 'js-yaml';
import Env from './Env.js';

function cloneObject(obj) {
  return JSON.parse(JSON.stringify(obj));
}

describe('NamespaceFetcher.getInitialNamespaceInfo', () => {
  test('site', () => {
    const env = new Env();
    expect(new NamespaceFetcher(env).getInitalNamespaceInfo('de')).toEqual({
      name: 'de',
      type: 'site',
    });
  });
  test('github', () => {
    const env = new Env();
    expect(new NamespaceFetcher(env).getInitalNamespaceInfo('johndoe')).toEqual(
      {
        github: 'johndoe',
        name: 'johndoe',
        type: 'user',
        url: `https://raw.githubusercontent.com/johndoe/trovu-data-user/master/shortcuts.yml?${env.commitHash}`,
      },
    );
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

  test('with loop', () => {
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
          url: 'https://reiseauskunft.bahn.de/bin/query.exe/d?S={%Start}&Z={%Ziel}&timesel=depart&start=1',
        },
        'db 2',
        '.de',
      ),
    ).toEqual(
      jsyaml.load(`
        url: https://reiseauskunft.bahn.de/bin/query.exe/d?S={%Start}&Z={%Ziel}&timesel=depart&start=1
        key: db 2
        keyword: db
        argumentCount: 2
        namespace: .de
        arguments:
          Start:
            '{%Start}': {}
          Ziel:
            '{%Ziel}': {}
        title: '' 
    `),
    );
  });
});
