import Helper from "../src/Helper.js";

const getUrlHashFooBar = () => {
  const hash = "foo=bar&baz=boo";
  return hash;
};

test("getUrlParams", () => {
  Helper.getUrlHash = getUrlHashFooBar;
  expect(Helper.getUrlParams()).toEqual({ foo: "bar", baz: "boo" });
});

test("splitKeepRemainder", () => {
  expect(Helper.splitKeepRemainder("g foo, bar", " ", 2)).toEqual([
    "g",
    "foo, bar"
  ]);
});

test("escapeRegExp", () => {
  expect(Helper.escapeRegExp('foo.*bar[baz]')).toMatch('foo\\.\\*bar\\[baz\\]');
});