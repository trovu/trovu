import SuggestionsGetter from "./SuggestionsGetter";

const emptyMatches = () => ({
  showOnHome: [],
  keywordFullReachable: [],
  keywordFullUnreachable: [],
  keywordBeginReachable: [],
  keywordBeginUnreachable: [],
  titleBeginReachable: [],
  titleBeginUnreachable: [],
  titleMiddleReachable: [],
  titleMiddleUnreachable: [],
  tagMiddleReachable: [],
  tagMiddleUnreachable: [],
  urlMiddleReachable: [],
  urlMiddleUnreachable: [],
});

const createShortcut = (overrides = {}) => ({
  namespace: "main",
  keyword: "gm",
  argumentCount: 1,
  title: "Google Maps",
  url: "https://maps.example.com/search",
  reachable: true,
  ...overrides,
});

describe("SuggestionsGetter.getRegExpAndFilters", () => {
  test("extracts namespace, tag and url filters while keeping the remaining query searchable", () => {
    const getter = new SuggestionsGetter({
      namespaceInfos: {
        foo: {},
      },
    });

    const [regExp, filters] = getter.getRegExpAndFilters("foo.gm tag:maps url:google") as [
      RegExp,
      { namespace?: string; tag?: string; url?: string },
    ];

    expect(filters).toEqual({
      namespace: "foo",
      tag: "maps",
      url: "google",
    });
    expect(regExp.test("gm")).toBe(true);
    expect(regExp.test("bing")).toBe(false);
  });
});

describe("SuggestionsGetter.getMatches", () => {
  test("groups full keyword matches and ignores deprecated or removed shortcuts", () => {
    const reachableShortcut = createShortcut({ namespace: "foo", keyword: "gm", title: "Reachable map" });
    const unreachableShortcut = createShortcut({
      namespace: "foo",
      keyword: "gm",
      title: "Offline map",
      reachable: false,
    });
    const getter = new SuggestionsGetter({
      namespaceInfos: {
        foo: {
          shortcuts: {
            "gm 1": reachableShortcut,
            "gm 2": unreachableShortcut,
            "gm 3": createShortcut({ keyword: "gm", deprecated: { created: "2024-01-01" } }),
            "gm 4": createShortcut({ keyword: "gm", removed: { created: "2024-01-01" } }),
          },
        },
      },
    });

    const matches = getter.getMatches("gm berlin");

    expect(matches.keywordFullReachable).toEqual([reachableShortcut]);
    expect(matches.keywordFullUnreachable).toEqual([unreachableShortcut]);
    expect(matches.titleBeginReachable).toEqual([]);
    expect(matches.urlMiddleReachable).toEqual([]);
  });

  test("applies namespace filters and classifies title, tag and url matches", () => {
    const titleShortcut = createShortcut({
      namespace: "foo",
      keyword: "city",
      title: "Berlin guide",
      url: "https://example.com/guide",
    });
    const tagShortcut = createShortcut({
      namespace: "foo",
      keyword: "rail",
      title: "Train travel",
      url: "https://example.com/trains",
      tags: ["mobility", "railway"],
    });
    const urlShortcut = createShortcut({
      namespace: "foo",
      keyword: "route",
      title: "Trip planner",
      url: "https://bahn.example.com/connections",
      reachable: false,
    });
    const otherNamespaceShortcut = createShortcut({
      namespace: "bar",
      keyword: "city",
      title: "Berlin guide elsewhere",
      url: "https://example.com/elsewhere",
    });
    const getter = new SuggestionsGetter({
      namespaceInfos: {
        foo: {
          shortcuts: {
            "city 1": titleShortcut,
            "rail 1": tagShortcut,
            "route 1": urlShortcut,
          },
        },
        bar: {
          shortcuts: {
            "city 1": otherNamespaceShortcut,
          },
        },
      },
    });

    expect(getter.getMatches("ns:foo berlin").titleBeginReachable).toEqual([titleShortcut]);
    expect(getter.getMatches("ns:foo railway").tagMiddleReachable).toEqual([tagShortcut]);
    expect(getter.getMatches("ns:foo bahn").urlMiddleUnreachable).toEqual([urlShortcut]);
  });
});

describe("SuggestionsGetter.getSuggestions", () => {
  test("returns showOnHome suggestions sorted by their configured order", () => {
    const getter = new SuggestionsGetter({ namespaceInfos: {} });
    const first = createShortcut({ keyword: "a", showOnHome: 2 });
    const second = createShortcut({ keyword: "b", showOnHome: 1 });
    jest.spyOn(getter, "getMatches").mockReturnValue({
      ...emptyMatches(),
      showOnHome: [first, second],
    });

    expect(getter.getSuggestions("featured")).toEqual([second, first]);
  });

  test("sorts suggestions within categories and removes duplicates across categories", () => {
    const getter = new SuggestionsGetter({ namespaceInfos: {} });
    const alpha = createShortcut({ namespace: "foo", keyword: "alpha", title: "Alpha" });
    const beta = createShortcut({ namespace: "foo", keyword: "beta", title: "Beta" });
    const duplicate = createShortcut({ namespace: "foo", keyword: "dup", title: "Duplicate" });
    const unreachable = createShortcut({ namespace: "foo", keyword: "zzz", reachable: false });

    jest.spyOn(getter, "getMatches").mockReturnValue({
      ...emptyMatches(),
      keywordBeginReachable: [beta, alpha],
      keywordBeginUnreachable: [unreachable],
      titleBeginReachable: [duplicate],
      urlMiddleReachable: [duplicate],
    });

    expect(getter.getSuggestions("du")).toEqual([alpha, beta, unreachable, duplicate]);
  });
});
