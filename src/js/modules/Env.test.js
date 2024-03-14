import Env from './Env.js';

const getUrlHashFooBar = () => {
  const hash = 'foo=bar&baz=boo';
  return hash;
};

describe('Env', () => {
  describe('buildUrlParams', () => {
    test('github', () => {
      expect(new Env({ github: 'johndoe' }).buildUrlParams()).toEqual({
        github: 'johndoe',
      });
    });
    test('configUrl', () => {
      expect(
        new Env({
          configUrl: 'https://example.com/config.yml',
        }).buildUrlParams(),
      ).toEqual({
        configUrl: 'https://example.com/config.yml',
      });
    });
    test('language and country', () => {
      expect(
        new Env({ language: 'en', country: 'us' }).buildUrlParams(),
      ).toEqual({
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
        }).buildUrlParams(),
      ).toEqual({
        language: 'en',
        country: 'us',
        defaultKeyword: 'example',
      });
    });
    test('debug', () => {
      expect(new Env({ debug: true }).buildUrlParams()).toEqual({
        debug: 1,
      });
    });
    test('status', () => {
      expect(new Env({ status: 'deprecated' }).buildUrlParams()).toEqual({
        status: 'deprecated',
      });
    });
  });
  describe('getDefaultLanguageAndCountry', () => {
    test('browser returns language and country', () => {
      const env = new Env();
      env.getNavigatorLanguage = jest.fn(() => 'en-DE');
      expect(env.getDefaultLanguageAndCountry()).toEqual({
        language: 'en',
        country: 'de',
      });
    });
    test('browser returns only language', () => {
      const env = new Env();
      env.getNavigatorLanguage = jest.fn(() => 'en');
      expect(env.getDefaultLanguageAndCountry()).toEqual({
        language: 'en',
        country: 'us',
      });
    });
    test('browser returns empty language', () => {
      const env = new Env();
      env.getNavigatorLanguage = jest.fn(() => '');
      expect(env.getDefaultLanguageAndCountry()).toEqual({
        language: 'en',
        country: 'us',
      });
    });
    test('browser returns invalid language', () => {
      const env = new Env();
      env.getNavigatorLanguage = jest.fn(() => 'invalid');
      expect(env.getDefaultLanguageAndCountry()).toEqual({
        language: 'en',
        country: 'us',
      });
    });
  });
  test('getUrlParams', () => {
    Env.getUrlHash = getUrlHashFooBar;
    expect(Env.getUrlParams()).toEqual({ foo: 'bar', baz: 'boo' });
  });
  test('setBoolParams', () => {
    expect(Env.setBoolParams({ debug: '1', reload: '1', foo: '1' })).toEqual({
      debug: true,
      reload: true,
    });
  });
});
