import Env from './Env.js';
const env = new Env({});

describe('Env.getDefaultLanguageAndCountry', () => {
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
