const { test, expect } = require("@playwright/test");

test.describe("Homepage startup", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[data-page-loaded="true"]')).toBeVisible();
  });

  test("should redirect to hash with language and country", async ({ page }) => {
    await expect(page).toHaveURL(/country=gb&language=en/);
  });

  test('should have a title including "trovu"', async ({ page }) => {
    await expect(page).toHaveTitle(/trovu/i);
  });

  test("should contain an Opensearch tag", async ({ page }) => {
    await expect(page.locator('head link[rel="search"]')).toHaveAttribute(
      "href",
      "/opensearch/?country=gb&language=en",
    );
  });

  test("should have focus on input", async ({ page }) => {
    await expect(page.locator("#query")).toBeFocused();
  });

  test("should have suggestions", async ({ page }) => {
    await page.locator("#query").fill("g");
    await expect(page.getByText("Google Web Homepage")).toBeVisible();
  });

  test("should have suggestions with type icons", async ({ page }) => {
    await page.locator("#query").fill("db");
    await expect(page.locator(".argument-names", { hasText: "📅" }).first()).toBeVisible();
  });

  test("should have a working Settings modal", async ({ page }) => {
    await page.locator("span#settings-button").click();
    await page.locator("select#languageSetting").selectOption("pl");
    await page.locator("select#countrySetting").selectOption("cz");
    await page.locator("#settings-close").click();
    await expect(page).toHaveURL(/language=pl/);
    await expect(page).toHaveURL(/country=cz/);
    await expect(page.locator(".navbar .language")).toContainText("pl");
    await expect(page.locator(".navbar .country")).toContainText("🇨🇿");
  });

  test("should submit a query", async ({ page }) => {
    await page.locator("#query").fill("debug:g");
    await page.locator("#query").press("Enter");
    await expect(page.locator("#targetDomain")).toContainText("https://www.google.");
  });

  test("should submit a query with extra namespace", async ({ page }) => {
    await page.locator("#query").fill("debug:.cz.cd a,b");
    await page.locator("#query").press("Enter");
    await expect(page.locator("#targetDomain")).toContainText("https://www.cd.cz");
  });
});

test.describe("Homepage, Shortcut not found, show suggestions", () => {
  test("should show not_found", async ({ page }) => {
    await page.goto("/#country=gb&language=en&query=google&status=not_found");
    await expect(page.locator("#query")).toHaveValue("google");
    await expect(page.getByText("No matching shortcut found.")).toBeVisible();
    await expect(page.getByText("Google Web Homepage")).toBeVisible();
    await page.locator("#query").fill("debug:g foobar");
    await page.locator("#query").press("Enter");
    await expect(page.locator("#targetDomain")).toContainText("https://www.google");
  });
});
