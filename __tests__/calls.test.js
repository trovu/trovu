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

async function testCall(call) {
  const env = new Env();
  env.language = 'en';
  env.country = 'us';
  // TODO: Find an official way of Jest to log this.
  console.log(call.title);
  await env.populate(call.env);
  const response = await CallHandler.getRedirectResponse(env);
  if (call.response.redirectUrl) {
    expect(response.redirectUrl).toMatch(call.response.redirectUrl);
  } else {
    expect(response).toStrictEqual(call.response);
  }
}
