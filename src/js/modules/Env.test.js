import Env from './Env.js';

const getUrlHashFooBar = () => {
  const hash = 'foo=bar&baz=boo';
  return hash;
};

describe('Env', () => {
  describe('getDefaultLanguageAndCountry', () => {
    test('browser returns language and country', () => {
      const env = new Env();
      env.getNavigatorLanguage = jest.fn(() => 'en-DE');
      expect(env.getDefaultLanguageAndCountry()).resolves.toEqual({
        language: 'en',
        country: 'de',
      });
    });
    test('browser returns only language', () => {
      const env = new Env();
      env.getNavigatorLanguage = jest.fn(() => 'en');
      expect(env.getDefaultLanguageAndCountry()).resolves.toEqual({
        language: 'en',
        country: 'us',
      });
    });
  });
  test('getUrlParams', () => {
    Env.getUrlHash = getUrlHashFooBar;
    expect(Env.getUrlParams()).toEqual({ foo: 'bar', baz: 'boo' });
  });
});
