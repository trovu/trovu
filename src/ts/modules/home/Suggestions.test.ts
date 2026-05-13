jest.mock("@fortawesome/fontawesome-free/css/all.min.css", () => ({}));

const Suggestions = require("./Suggestions").default;

const createRenderer = () => {
  document.body.innerHTML = "<input id=\"query\"><div id=\"suggestions\"></div><div id=\"help\"></div>";

  const renderer = Object.create(Suggestions.prototype);
  renderer.env = {
    data: {
      config: {
        url: {
          docs: "https://docs.example/",
        },
      },
    },
    namespaceInfos: {
      evil: {
        type: "user",
      },
    },
  };
  renderer.home = {
    submitQuery: jest.fn(),
  };
  renderer.queryInput = document.querySelector("#query");

  return renderer;
};

describe("Suggestions", () => {
  test("renders shortcut fields as text instead of executable markup", () => {
    const renderer = createRenderer();
    const payload = "<img src=x onerror=\"alert(1)\"><script>alert(1)</script>";

    const element = renderer.renderSuggestion(
      {
        namespace: "evil",
        keyword: payload,
        argumentString: payload,
        argumentCount: 1,
        title: payload,
        description: payload,
        url: "https://example.com/search",
        reachable: false,
        tags: [payload],
        examples: [
          {
            arguments: payload,
            description: payload,
          },
        ],
      },
      0,
    ) as HTMLElement;

    expect(element.querySelector("img")).toBeNull();
    expect(element.querySelector("script")).toBeNull();
    const topDescription = Array.from(element.children).find(
      (child) => child.className === "description",
    ) as HTMLElement;
    expect(element.querySelector(".title")?.textContent).toBe(payload);
    expect(topDescription.querySelector(".text")?.textContent).toBe(payload);
    expect(element.querySelector(".tag")?.textContent).toBe(payload);
    expect(element.querySelector(".examples .description")?.textContent).toBe(payload);
  });
});
