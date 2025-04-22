// @ts-nocheck

/**
 * @jest-environment jsdom
 */
import CallHandler from "../src/ts/modules/CallHandler";
import Env from "../src/ts/modules/Env";
import "./mocks.utils";
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
  window.localStorage.clear();
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
