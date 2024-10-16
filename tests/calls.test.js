/**
 * @jest-environment jsdom
 */
import CallHandler from "../src/js/modules/CallHandler.js";
import Env from "../src/js/modules/Env.js";
import "./mocks.utils.js";
import fs from "fs";
import "isomorphic-fetch";
import jsyaml from "js-yaml";

main();

async function main() {
  jest.setTimeout(20000);
  const calls = jsyaml.load(fs.readFileSync("./tests/calls.yml", "utf8"));
  calls.forEach((call) => {
    test(call.title, async () => {
      await testCall(call);
    });
  });
}

async function testCall(call) {
  const env = new Env({ context: "node" });
  env.getNavigatorLanguage = () => "en-US";
  await env.populate(call.env);
  const response = await CallHandler.getRedirectResponse(env);
  if (call.response.redirectUrl) {
    expect(response.redirectUrl).toMatch(call.response.redirectUrl);
  } else {
    expect(response).toStrictEqual(call.response);
  }
}
