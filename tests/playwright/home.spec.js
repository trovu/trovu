const { test, expect } = require("@playwright/test");

async function openLoadedHomepage(page, hash = "") {
  await page.goto(`/${hash}`);
  await expect(page.locator('[data-page-loaded="true"]')).toBeVisible();
}

test.describe("Homepage from default load", () => {
  test.beforeEach(async ({ page }) => {
    await openLoadedHomepage(page);
  });

  test.describe("Startup", () => {
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
  });

  test.describe("Interactions", () => {
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
      await expect(page.locator("#target-domain")).toContainText("https://www.google.");
    });

    test("should submit a query with extra namespace", async ({ page }) => {
      await page.locator("#query").fill("debug:.cz.cd a,b");
      await page.locator("#query").press("Enter");
      await expect(page.locator("#target-domain")).toContainText("https://www.cd.cz");
    });

    test("should switch to advanced settings when a GitHub username is saved", async ({ page }) => {
      await page.locator("span#settings-button").click();
      await page.locator("#advanced-tab").click();
      await page.locator("#githubSetting").fill("trovu");
      await page.locator("#settings-close").click();
      await expect(page).toHaveURL(/github=trovu/);
      await expect(page.locator('head link[rel="search"]')).toHaveAttribute("href", "/opensearch/?github=trovu");
      await page.locator("span#settings-button").click();
      await page.locator("#basic-tab").click();
      await expect(page.locator(".using-advanced")).not.toHaveClass(/d-none/);
      await expect(page.locator(".using-basic")).toHaveClass(/d-none/);
    });

    test("should filter suggestions when clicking a namespace badge", async ({ page }) => {
      await page.locator("#query").fill("g");
      const namespaceBadge = page.locator("li", { hasText: "Google Web Homepage" }).locator(".namespace").first();
      const namespace = ((await namespaceBadge.textContent()) || "").trim();
      await namespaceBadge.click();
      await expect(page.locator("#query")).toHaveValue(`ns:${namespace}`);
      await expect(page.locator("#suggestions")).toBeVisible();
    });

    test("should filter suggestions when clicking a tag badge", async ({ page }) => {
      await page.locator("#query").fill("g");
      const suggestion = page.locator("li", { hasText: "Google Web Homepage" }).first();
      await suggestion.click();
      const selectedSuggestion = page.locator('li[aria-selected="true"]', { hasText: "Google Web Homepage" }).first();
      const tagBadge = selectedSuggestion.locator(".tag").first();
      const tag = ((await tagBadge.textContent()) || "").trim();
      await tagBadge.click();
      await expect(page.locator("#query")).toHaveValue(`tag:${tag}`);
      await expect(page.locator("#suggestions")).toBeVisible();
    });
  });
});

test.describe("Homepage status states", () => {
  test("should show not_found and recover with a valid shortcut", async ({ page }) => {
    await openLoadedHomepage(page, "#country=gb&language=en&query=google&status=not_found");
    await expect(page.locator("#query")).toHaveValue("google");
    await expect(page.getByText("No matching shortcut found.")).toBeVisible();
    await expect(page.getByText("Google Web Homepage")).toBeVisible();
    await page.locator("#query").fill("debug:g foobar");
    await page.locator("#query").press("Enter");
    await expect(page.locator("#target-domain")).toContainText("https://www.google");
  });

  test("should prefill the alternative query for deprecated shortcuts", async ({ page }) => {
    await openLoadedHomepage(page, "#country=gb&language=en&query=oldshortcut&status=deprecated&alternative=g%20berlin");
    await expect(page.locator("#query")).toHaveValue("g berlin");
    await expect(page.locator("#alert")).toContainText("deprecated");
    await expect(page.locator("#alert em.query")).toHaveText("oldshortcut");
  });

  test("should show the suspicious shortcut warning with an issue link", async ({ page }) => {
    await openLoadedHomepage(page, "#country=gb&language=en&query=evil&status=suspicious");
    const issueLink = page.locator('#alert a[href="https://github.com/trovu/trovu/issues/new"]');
    await expect(page.locator("#alert")).toContainText("might be harmful");
    await expect(issueLink).toBeVisible();
  });

  test("should show the removed shortcut GitHub search link", async ({ page }) => {
    await openLoadedHomepage(page, "#country=gb&language=en&query=foo&status=removed&key=o.foo%201");
    const githubLink = page.locator("#alert a.githubLink");
    await expect(githubLink).toHaveText("foo");
    await expect(githubLink).toHaveAttribute("href", /o\.foo%201\+repo%3Atrovu%2Ftrovu-data/);
  });
});
