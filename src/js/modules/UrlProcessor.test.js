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

test('UrlProcessor.getVariablesFromString new', async () => {
  expect(
    UrlProcessor.getVariablesFromString('https://<$language>.<query>'),
  ).toEqual({
    $language: {
      '<$language>': {},
    },
    query: {
      '<query>': {},
    },
  });
});

test('UrlProcessor.getArgumentsFromString legacy', async () => {
  expect(UrlProcessor.getArgumentsFromString('https://{%query}')).toEqual({
    query: {
      '{%query}': {},
    },
  });
});

test('UrlProcessor.getPlaceholdersFromString', async () => {
  expect(UrlProcessor.getPlaceholdersFromString('https://<query>', '')).toEqual(
    {
      query: {
        '<query>': {},
      },
    },
  );
});

test('UrlProcessor.getPlaceholdersFromStringLegacy', async () => {
  expect(
    UrlProcessor.getPlaceholdersFromStringLegacy('https://{%query}', '%'),
  ).toEqual({
    query: {
      '{%query}': {},
    },
  });
});

test('UrlProcessor.getPlaceholdersFromString', async () => {
  expect(
    UrlProcessor.getPlaceholdersFromString(
      'https://<Start: { type: city }>',
      '',
    ),
  ).toEqual({
    Start: {
      '<Start: { type: city }>': {
        type: 'city',
      },
    },
  });
});

test('UrlProcessor.getPlaceholdersFromStringLegacy', async () => {
  expect(
    UrlProcessor.getPlaceholdersFromStringLegacy(
      'https://{%Start|type=city}',
      '%',
    ),
  ).toEqual({
    Start: {
      '{%Start|type=city}': {
        type: 'city',
      },
    },
  });
});

test('UrlProcessor.getPlaceholderFromMatch', async () => {
  expect(UrlProcessor.getPlaceholderFromMatch([, 'query'])).toEqual({
    name: 'query',
    placeholder: {},
  });
});

test('UrlProcessor.getPlaceholderFromMatchLegacy', async () => {
  expect(UrlProcessor.getPlaceholderFromMatchLegacy([, 'query'])).toEqual({
    name: 'query',
    placeholder: {},
  });
});

test('UrlProcessor.getPlaceholderFromMatch', async () => {
  expect(
    UrlProcessor.getPlaceholderFromMatch([, 'Start: { type: city}']),
  ).toEqual({
    name: 'Start',
    placeholder: {
      type: 'city',
    },
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
