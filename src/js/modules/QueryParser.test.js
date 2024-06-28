import QueryParser from "./QueryParser.js";

describe("QueryParser.parse", () => {
  test("2 arguments", () => {
    expect(QueryParser.parse("db b,hh")).toMatchObject({
      keyword: "db",
      args: ["b", "hh"],
    });
  });

  test("uppercase keyword", () => {
    expect(QueryParser.parse("G foobar")).toMatchObject({
      keyword: "g",
    });
  });

  test("extra namespace / language", () => {
    expect(QueryParser.parse("pl.wg berlin")).toMatchObject({
      extraNamespaceName: "pl",
      keyword: "wg",
      language: "pl",
    });
  });
});
