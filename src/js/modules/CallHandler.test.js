import CallHandler from './CallHandler.js';
import Env from './Env.js';

describe('CallHander', () => {
  test('getAlternative', async () => {
    const shortcut = {
      deprecated: {
        alternative: {
          query: 'gm b,<1>',
        },
      },
    };
    const env = {
      args: ['brandenburger tor'],
    };
    expect(CallHandler.getAlternative(shortcut, env)).toEqual(
      'gm b,brandenburger tor',
    );
  });
  test('getRedirectUrlToHome', async () => {
    Env.getUrlHash = () => {
      return 'country=at&language=de&query=reload';
    };
    const response = {
      status: 'reloaded',
    };
    expect(CallHandler.getRedirectUrlToHome(response)).toStrictEqual(
      '../index.html#country=at&language=de&status=reloaded',
    );
  });
});
