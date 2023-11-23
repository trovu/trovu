import UrlProcessor from './UrlProcessor.js';

test('UrlProcessor.transformEoCx', async () => {
  const expectations = {
    'ehxosxangxo cxiujxauxde': 'eĥoŝanĝo ĉiuĵaŭde',
    'EHXOSXANGXO CXIUJXAUXDE': 'EĤOŜANĜO ĈIUĴAŬDE',
    'EHxOSxANGxO CxIUJxAUxDE': 'EĤOŜANĜO ĈIUĴAŬDE',
  };
  for (const input in expectations) {
    const output = await UrlProcessor.transformEoCx(input);
    expect(output).toEqual(expectations[input]);
  }
});

test('UrlProcessor.getPlaceholdersFromStringLegacy', async () => {
  expect(
    UrlProcessor.getPlaceholdersFromStringLegacy(
      'https://www.google.com/search?hl=en&q=keyword1%20{%query}&ie=utf-8',
      '%',
    ),
  ).toEqual({
    query: {
      '{%query}': {},
    },
  });
});
