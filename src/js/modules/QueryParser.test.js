import QueryParser from './QueryParser.js';

describe('QueryParser.parse', () => {
  test('uppercase keyword', () => {
    expect(QueryParser.parse('G foobar')).toMatchObject({
      keyword: 'g',
    });
  });

  test('extra namespace / language', () => {
    expect(QueryParser.parse('pl.wg berlin')).toMatchObject({
      extraNamespaceName: 'pl',
      keyword: 'wg',
      language: 'pl',
    });
  });
});
