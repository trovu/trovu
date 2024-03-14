import CallHandler from '../src/js/modules/CallHandler.js';
import Env from '../src/js/modules/Env.js';
import fs from 'fs';
import 'isomorphic-fetch';
import jsyaml from 'js-yaml';

main();

async function main() {
  jest.setTimeout(20000);
  const calls = jsyaml.load(fs.readFileSync('./tests/calls.yml', 'utf8'));
  calls.forEach((call) => {
    test(call.title, async () => {
      await testCall(call);
    });
  });
}

global.fetch = jest.fn((url) => {
  if (url.includes('/testuser/trovu-data-user/master/config.yml')) {
    return Promise.resolve({
      status: 200,
      text: () => Promise.resolve('defaultKeyword: g'),
    });
  } else if (url.includes('/testuser/trovu-data-user/master/shortcuts.yml')) {
    return Promise.resolve({
      status: 200,
      text: () =>
        Promise.resolve(
          'keyword1 1: https://www.google.com/search?hl=en&q=keyword1%20{%query}&ie=utf-8',
        ),
    });
  }
});

beforeEach(() => {
  global.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

async function testCall(call) {
  const env = new Env();
  env.getNavigatorLanguage = () => 'en-US';
  env.language = 'en';
  env.country = 'us';
  await env.populate(call.env);
  const response = await CallHandler.getRedirectResponse(env);
  if (call.response.redirectUrl) {
    expect(response.redirectUrl).toMatch(call.response.redirectUrl);
  } else {
    expect(response).toStrictEqual(call.response);
  }
}
