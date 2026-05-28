import ShortcutFinder from './ShortcutFinder.js';

describe('ShortcutFinder', () => {
  test('matches g with one argument', () => {
    const shortcut = { reachable: true, title: 'Google.com' };
    const env = {
      keyword: 'g',
      args: ['test'],
      namespaceInfos: {
        o: {
          shortcuts: {
            'g 1': shortcut,
          },
        },
      },
    };

    expect(ShortcutFinder.findShortcut(env)).toBe(shortcut);
  });
});
