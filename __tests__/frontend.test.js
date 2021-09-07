const docroot = "http://127.0.0.1:8081/";

describe("Trovu homepage", () => {
  beforeAll(async () => {
    await page.goto(docroot, { waitUntil: "networkidle0" });
  });

  it("should redirect to hash with language and country", async () => {
    expect(await page.evaluate("location.hash")).toMatch(
      new RegExp("country=gb&language=en")
    );
  });

  it('should be titled "trovu"', async () => {
    await expect(page.title()).resolves.toMatch("trovu");
  });

  it("should have Suggestions", async () => {
    await page.focus("#query");
    await page.keyboard.type("g");
    await expect(page.content()).resolves.toMatch("Google.com");
  });

  it("should have a working Settings modal", async () => {
    await page.click("#settings-button");
    await page.select("#languageSetting", "pl");
    await page.waitFor(500); // TODO: Find cleaner solution.
    await page.click("#settingsSave"), await page.waitFor(500); // TODO: Find cleaner solution.
    expect(await page.evaluate("location.hash")).toMatch(
      new RegExp("language=pl")
    );
  });

  it("should show not_found", async () => {
    await page.goto(docroot + "#query=foobar&status=not_found", {
      waitUntil: "networkidle0",
    });
    await expect(page.content()).resolves.toMatch(
      "Could not find a matching shortcut for this query."
    );
  });
});
