import QueryParser from './QueryParser.js';

describe('QueryParser.parse', () => {
  test('uppercase keyword', () => {
    expect(QueryParser.parse('G foobar')).toMatchObject({
      keyword: 'g',
    });
  });
});
