import NamespaceFetcher from './NamespaceFetcher.js';
import jsyaml from 'js-yaml';

describe('NamespaceFetcher.getInitialNamespaceInfo', () => {
  test('site', () => {
    expect(new NamespaceFetcher({}).getInitalNamespaceInfo('de')).toEqual({
      name: 'de',
      type: 'site',
      url: 'https://data.trovu.net/data/shortcuts/de.yml',
    });
  });
  test('github', () => {
    expect(new NamespaceFetcher({}).getInitalNamespaceInfo('johndoe')).toEqual({
      github: 'johndoe',
      name: 'johndoe',
      type: 'user',
      url: 'https://raw.githubusercontent.com/johndoe/trovu-data-user/master/shortcuts.yml',
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
      new NamespaceFetcher({}).processInclude(shortcut, 'leo', namespaceInfos),
    ).toEqual({
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
      new NamespaceFetcher({}).processInclude(shortcut, '', namespaceInfos),
    ).toEqual({
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
      new NamespaceFetcher({ language: 'de' }).processInclude(
        shortcut,
        'leo',
        namespaceInfos,
      ),
    ).toEqual({
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
    expect(
      new NamespaceFetcher({}).processInclude(shortcut, 'leo', namespaceInfos),
    ).toEqual(false);
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
    expect(new NamespaceFetcher({}).addReachable(namespaceInfos)).toEqual(
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
      new NamespaceFetcher({}).addInfo(
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
