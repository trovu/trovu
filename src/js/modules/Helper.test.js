import Helper from "./Helper.js";

test("splitKeepRemainder", () => {
  expect(Helper.splitKeepRemainder("g foo, bar", " ", 2)).toEqual(["g", "foo, bar"]);
});
