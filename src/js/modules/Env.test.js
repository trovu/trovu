import Env from './Env.js';

const getUrlHashFooBar = () => {
  const hash = 'foo=bar&baz=boo';
  return hash;
};

describe('Env', () => {
  describe('getParams', () => {
    test('github', () => {
      expect(new Env({ github: 'johndoe' }).getParams()).toEqual({
        github: 'johndoe',
      });
    });
    test('configUrl', () => {
      expect(
        new Env({ configUrl: 'https://example.com/config.yml' }).getParams(),
      ).toEqual({
        configUrl: 'https://example.com/config.yml',
      });
    });
    test('language and country', () => {
      expect(new Env({ language: 'en', country: 'us' }).getParams()).toEqual({
        language: 'en',
        country: 'us',
      });
    });
    test('language, country and defaultKeyword', () => {
      expect(
        new Env({
          language: 'en',
          country: 'us',
          defaultKeyword: 'example',
        }).getParams(),
      ).toEqual({
        language: 'en',
        country: 'us',
        defaultKeyword: 'example',
      });
    });
    test('debug', () => {
      expect(new Env({ debug: true }).getParams()).toEqual({
        debug: 1,
      });
    });
    test('status', () => {
      expect(new Env({ status: 'deprecated' }).getParams()).toEqual({
        status: 'deprecated',
      });
    });
  });
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
