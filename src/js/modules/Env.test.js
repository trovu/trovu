import Env from './Env.js';
const env = new Env({});

// Mock the fetchDbIp function to return { foo: 'bar' }
jest.mock('./Env.js', () => {
  const originalModule = jest.requireActual('./Env.js');
  return {
    __esModule: true,
    ...originalModule,
    default: class EnvMock extends originalModule.default {
      async fetchDbIp() {
        return JSON.stringify({
          ipAddress: '89.245.199.31',
          continentCode: 'EU',
          continentName: 'Europe',
          countryCode: 'DE',
          countryName: 'Germany',
          stateProv: 'Hesse',
          city: 'Frankfurt am Main',
        });
      }
    },
  };
});

describe('Env.getCountryFromIP', () => {
  test('mocked fetch', async () => {
    expect(env.getCountryFromIp()).resolves.toEqual('DE');
  });
});
