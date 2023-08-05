import Env from './Env.js';
const env = new Env({});

describe('Env.getCountryFromIP', () => {
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
  test('mocked fetch', async () => {
    expect(env.getCountryFromIp()).resolves.toEqual('DE');
  });
});
