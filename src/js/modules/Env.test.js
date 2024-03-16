import '../../../tests/mocks.utils.js';
import Env from './Env.js';

const getUrlHashFooBar = () => {
  const hash = 'foo=bar&baz=boo';
  return hash;
};

describe('Env', () => {
  describe('buildUrlParams', () => {
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

  describe('buildUrlParamStr', () => {
    let env;

    beforeEach(() => {
      env = new Env();
      env.getNavigatorLanguage = () => 'en-US';
      env.getUserConfigFromUrl = () => `language: de
      country: at`;
    });

    test('empty', async () => {
      Env.getUrlHash = () => '';
      await env.populate();
      expect(env.buildUrlParamStr()).toEqual('country=us&language=en');
    });

    test('github', async () => {
      Env.getUrlHash = () => 'github=johndoe';
      await env.populate();
      expect(env.buildUrlParamStr()).toEqual('github=johndoe');
    });

    test('configUrl', async () => {
      Env.getUrlHash = () => 'configUrl=https://example.com/config.yml';
      await env.populate();
      expect(env.buildUrlParamStr()).toEqual(
        'configUrl=https%3A%2F%2Fexample.com%2Fconfig.yml',
      );
    });

    test('language, country', async () => {
      Env.getUrlHash = () => 'language=de&country=at';
      await env.populate();
      expect(env.buildUrlParamStr()).toEqual('country=at&language=de');
    });
  });

  test('getParamsFromUrl', () => {
    Env.getUrlHash = getUrlHashFooBar;
    expect(Env.getParamsFromUrl()).toEqual({ foo: 'bar', baz: 'boo' });
  });
  test('setBoolParams', () => {
    expect(Env.setBoolParams({ debug: '1', reload: '1', foo: '1' })).toEqual({
      debug: true,
      reload: true,
    });
  });
});
