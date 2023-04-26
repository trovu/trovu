import UrlProcessor from './UrlProcessor.js';

test('processTypeDate', async () => {
  const expectations = {
    14.5: '2023-05-14',
    '14.5.': '2023-05-14',
  };
  const locale = 'de-DE';
  const attributes = {};
  for (const input in expectations) {
    const output = await UrlProcessor.processTypeDate(
      input,
      locale,
      attributes,
    );
    expect(output).toEqual(expectations[input]);
  }
});
