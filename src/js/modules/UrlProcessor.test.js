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

test('UrlProcessor.getPlaceholdersFromString', async () => {
  expect(
    UrlProcessor.getPlaceholdersFromString('https://<query>', '%'),
  ).toEqual({
    query: {
      '{%query}': {},
    },
  });
});

test('UrlProcessor.getPlaceholderFromMatchLegacy', async () => {
  expect(UrlProcessor.getPlaceholderFromMatchLegacy([, 'query'])).toEqual({
    name: 'query',
    placeholder: {},
  });
});

test('UrlProcessor.getPlaceholderFromMatchLegacy', async () => {
  expect(
    UrlProcessor.getPlaceholderFromMatchLegacy([, 'Start|type=city']),
  ).toEqual({
    name: 'Start',
    placeholder: {
      type: 'city',
    },
  });
});
