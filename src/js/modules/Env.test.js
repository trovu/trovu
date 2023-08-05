import Env from './Env.js';
const env = new Env({});

env.fetchDbIp = jest.fn(() => {
  return JSON.stringify({
    ipAddress: '89.245.199.31',
    continentCode: 'EU',
    continentName: 'Europe',
    countryCode: 'DE',
    countryName: 'Germany',
    stateProv: 'Hesse',
    city: 'Frankfurt am Main',
  });
});

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

describe('Env.getCountryFromIP', () => {
  test('mocked fetch', async () => {
    expect(env.getCountryFromIp()).resolves.toEqual('DE');
  });
});
