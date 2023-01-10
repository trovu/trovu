import CallHandler from '../src/js/modules/CallHandler.js';
import Env from '../src/js/modules/Env.js';
import 'isomorphic-fetch';
import jsyaml from 'js-yaml';
import fs from 'fs';

main();

async function main() {
  const calls = jsyaml.load(fs.readFileSync('./__tests__/calls.yml', 'utf8'));
  calls.forEach((call) => {
    test(JSON.stringify(call), async () => {
      await testCall(call);
    });
  });
}

async function testCall(call) {
  const env = new Env();
  env.language = 'en';
  env.country = 'us';
  await env.populate(call.env);
  const response = await CallHandler.getRedirectResponse(env);
  if (call.expected.redirectUrl) {
    expect(response.redirectUrl).toMatch(call.expected.redirectUrl);
  } else {
    expect(response).toStrictEqual(call.expected);
  }
}
