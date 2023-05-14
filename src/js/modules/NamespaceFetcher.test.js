import NamespaceFetcher from './NamespaceFetcher.js';
import jsyaml from 'js-yaml';

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

  test('simple', () => {
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
