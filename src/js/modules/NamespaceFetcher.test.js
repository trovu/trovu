import NamespaceFetcher from './NamespaceFetcher.js';
import jsyaml from 'js-yaml';

test('NamespaceFetcher.processInclude', () => {
  const expectations = new Map();
  expectations.set(
    {
      shortcut: jsyaml.load(`
        include:
          key: fr-de 1
          namespace: leo
      `),
      namespaceInfos: jsyaml.load(`
        leo:
          shortcuts:
            de-fr 1:
              url: https://dict.leo.org/französisch-deutsch/{%word}
              title: Allemand-Français (leo.org)
            fr-de 1:
              title: Französisch-Deutsch (leo.org)
              include:
                key: de-fr 1
      `),
    },
    {
      url: 'https://dict.leo.org/französisch-deutsch/{%word}',
      title: 'Französisch-Deutsch (leo.org)',
    },
  );

  for (const [input, expected] of expectations) {
    const output = new NamespaceFetcher({}).processInclude(
      input.shortcut,
      '',
      input.namespaceInfos,
    );
    expect(output).toEqual(expected);
  }
});
