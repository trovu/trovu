import CallHandler from './CallHandler.js';
import Env from './Env.js';

describe('CallHandler', () => {
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
    const env = new Env();
    Env.getUrlHash = () => {
      return 'country=at&language=de&query=reload';
    };
    const response = {
      status: 'reloaded',
    };
    expect(CallHandler.getRedirectUrlToHome(env, response)).toStrictEqual(
      '../index.html#country=at&language=de&status=reloaded',
    );
  });
});
