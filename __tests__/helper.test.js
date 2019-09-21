import Helper from "../public/js/helper.js";

  const getUrlHashFooBar = () => {
  const hash = 'foo=bar&baz=boo'
  return hash;
}

test("jqueryDeparam", () => {
  expect(Helper.jqueryDeparam('foo=bar&baz=boo')).toEqual({foo: 'bar', baz: 'boo' });
});

test("getParams", () => {
  Helper.getUrlHash = getUrlHashFooBar;
  expect(Helper.getParams()).toEqual({foo: 'bar', baz: 'boo' });
});
