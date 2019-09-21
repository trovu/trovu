import Helper from "../public/js/helper.js";

const getUrlHashFooBar = () => {
  const hash = "foo=bar&baz=boo";
  return hash;
};

test("jqueryDeparam", () => {
  expect(Helper.jqueryDeparam("foo=bar&baz=boo")).toEqual({
    foo: "bar",
    baz: "boo"
  });
});

test("jqueryParam", () => {
  expect(Helper.jqueryParam({
    foo: "bar",
    baz: "boo"
  })).toEqual("foo=bar&baz=boo");
});

test("getParams", () => {
  Helper.getUrlHash = getUrlHashFooBar;
  expect(Helper.getParams()).toEqual({ foo: "bar", baz: "boo" });
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