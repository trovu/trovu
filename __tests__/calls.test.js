import CallHandler from '../src/js/modules/CallHandler.js';
import Env from '../src/js/modules/Env.js';
import 'isomorphic-fetch';
import jsyaml from 'js-yaml';
import fs from 'fs';

main();

async function main() {
  jest.setTimeout(20000);
  const calls = jsyaml.load(fs.readFileSync('./__tests__/calls.yml', 'utf8'));
  calls.forEach((call) => {
    test(call.title, async () => {
      await testCall(call);
    });
  });
}

global.fetch = jest.fn((url) => {
  if (url.includes('/georgjaehnig/trovu-data-user/master/config.yml')) {
    return Promise.resolve({
      status: 200,
      text: () => Promise.resolve('defaultKeyword: g'),
    });
  } else if (
    url.includes('/georgjaehnig/trovu-data-user/master/shortcuts.yml')
  ) {
    // Handle other URLs or simulate errors
    return Promise.resolve({
      status: 200, // or another status code as appropriate
      text: () =>
        Promise.resolve(
          'trovu-test1 1: https://www.google.de/search?hl=de&q=trovu-test1%20{%query}&ie=utf-8',
        ),
    });
  }
});

afterEach(() => {
  jest.clearAllMocks();
});

async function testCall(call) {
  const env = new Env();
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
