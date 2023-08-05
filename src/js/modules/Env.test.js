import Env from './Env.js';
const env = new Env({});

describe('Env.getLanguageAndCountryFromBrowser', () => {
  test('browser returns language and country', () => {
    const env = new Env();
    env.getNavigatorLanguage = jest.fn(() => {
      return 'en-DE';
    });
    expect(env.getLanguageAndCountryFromBrowser()).toEqual({
      language: 'en',
      country: 'de',
    });
  });
});

describe('Env.getCountryFromIP', () => {
  test('mocked fetch', async () => {
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
    expect(env.getCountryFromIp()).resolves.toEqual('DE');
  });
});
