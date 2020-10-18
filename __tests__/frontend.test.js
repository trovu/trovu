const docroot = "http://l.tro:8080/#language=en&country=us";

describe("Trovu homepage", () => {
  beforeAll(async () => {
    await page.goto(docroot, { waitUntil: "networkidle0" });
  });

  it('should be titled "trovu"', async () => {
    await expect(page.title()).resolves.toMatch("trovu");
  });

  it("should have Suggestions", async () => {
    await page.focus("#query");
    await page.keyboard.type("g");
    await expect(page.content()).resolves.toMatch("Google.com");
  });
});
