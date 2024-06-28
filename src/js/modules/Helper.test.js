import Helper from "./Helper.js";

test("splitKeepRemainder", () => {
  expect(Helper.splitKeepRemainder("g foo, bar", " ", 2)).toEqual(["g", "foo, bar"]);
});

test("escapeRegExp", () => {
  expect(Helper.escapeRegExp("foo.*bar[baz]")).toMatch("foo\\.\\*bar\\[baz\\]");
});
