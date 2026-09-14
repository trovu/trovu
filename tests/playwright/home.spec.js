const { test, expect } = require("@playwright/test");

async function openLoadedHomepage(page, hash = "") {
  await page.goto(`/${hash}`);
  await expect(page.locator('[data-page-loaded="true"]')).toBeVisible();
}

test("Homepage startup should not wait for images", async ({ page }) => {
  let resumeLogo;
  await page.route("**/img/logo.png", async (route) => {
    await new Promise((resolve) => {
      resumeLogo = resolve;
    });
    await route.continue();
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  try {
    await expect(page.locator('[data-page-loaded="true"]')).toBeVisible();
  } finally {
    resumeLogo?.();
  }
  await page.waitForLoadState("load");
});

test("Homepage startup should not reload after normalizing the hash", async ({ page }) => {
  let navigationRequests = 0;
  page.on("request", (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
      navigationRequests += 1;
    }
  });

  await openLoadedHomepage(page);
  await page.waitForTimeout(100);
  expect(navigationRequests).toBe(1);
});

test("Homepage HTML should expose a loading state before JavaScript runs", async ({ page }) => {
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() === "script") {
      await route.abort();
      return;
    }
    await route.continue();
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  const submitButton = page.locator('#query-form button[type="submit"]');
  await expect(page.locator("html")).toHaveAttribute("aria-busy", "true");
  await expect(submitButton).toHaveClass(/btn-loading/);
  await expect(submitButton).toHaveAttribute("aria-label", "Shortcuts are loading");
  await expect(submitButton).toHaveText("⏳");
});

test("Homepage should expose a loading state and reject an early submit", async ({ page }) => {
  let resumeData;
  let shouldDelayData = true;
  await page.route("**/data.json?*", async (route) => {
    if (!shouldDelayData) {
      await route.continue();
      return;
    }
    await new Promise((resolve) => {
      resumeData = resolve;
    });
    await route.continue();
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  const queryInput = page.locator("#query");
  const submitButton = page.locator('#query-form button[type="submit"]');
  try {
    await expect(page.locator("html")).toHaveAttribute("aria-busy", "true");
    await expect(queryInput).toBeFocused();
    await expect(page.locator(".tagline")).toBeVisible();
    await expect(page.locator(".examples")).toBeVisible();
    await expect(submitButton).toHaveClass(/btn-loading/);
    await expect(submitButton).toHaveAttribute("aria-label", "Shortcuts are loading");
    await expect(submitButton).toHaveText("⏳");

    await queryInput.fill("debug:g foobar");
    await queryInput.press("Enter");
    await expect(page).toHaveURL(/query=debug%3Ag\+foobar/);
    await expect(page).toHaveURL(/status=loading/);
    await expect(page.locator("#alert")).toContainText("Shortcuts were still loading when you submitted.");
  } finally {
    shouldDelayData = false;
    resumeData?.();
  }

  await expect(page.locator('[data-page-loaded="true"]')).toBeVisible();
  await expect(page.locator("html")).not.toHaveAttribute("aria-busy", "true");
  await expect(submitButton).toHaveClass(/btn-primary/);
  await expect(submitButton).toHaveAttribute("aria-label", "Search");
  await expect(submitButton.locator(".fa-caret-right")).toBeVisible();
  await expect(queryInput).toHaveValue("debug:g foobar");
  await expect(page).toHaveURL(/status=loading/);
  await expect(page.locator("#alert")).toContainText("Shortcuts were still loading when you submitted.");

  await queryInput.press("Enter");
  await expect(page.locator("#target-domain")).toContainText("https://www.google");
});

test("Homepage should load a stored GitHub config without a second navigation", async ({ page }) => {
  let navigationRequests = 0;
  let configRequests = 0;
  await page.addInitScript(() => {
    localStorage.setItem("github", "testuser");
  });
  await page.route("https://raw.githubusercontent.com/testuser/trovu-data-user/master/config.yml", async (route) => {
    configRequests += 1;
    await route.fulfill({
      body: "defaultKeyword: g",
      contentType: "text/yaml",
      status: 200,
    });
  });
  page.on("request", (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
      navigationRequests += 1;
    }
  });

  await openLoadedHomepage(page);
  await page.waitForTimeout(100);
  expect(configRequests).toBe(1);
  expect(navigationRequests).toBe(1);
  await expect(page).toHaveURL(/github=testuser/);
  await expect(page.locator('head link[rel="search"]')).toHaveAttribute("href", "/opensearch/?github=testuser");
});

test("Homepage should show submit progress while resolving a query", async ({ page }) => {
  let configRequests = 0;
  let resumeSubmitConfig;
  await page.addInitScript(() => {
    localStorage.setItem("github", "testuser");
  });
  await page.route("https://raw.githubusercontent.com/testuser/trovu-data-user/master/config.yml", async (route) => {
    configRequests += 1;
    if (configRequests === 2) {
      await new Promise((resolve) => {
        resumeSubmitConfig = resolve;
      });
    }
    await route.fulfill({
      body: "defaultKeyword: g",
      contentType: "text/yaml",
      status: 200,
    });
  });
  await page.route("https://www.google.co.uk/**", async (route) => {
    await route.fulfill({
      body: "<!doctype html><title>Google</title>",
      contentType: "text/html",
      status: 200,
    });
  });

  await openLoadedHomepage(page);
  expect(configRequests).toBe(1);
  const queryForm = page.locator("#query-form");
  const queryInput = page.locator("#query");
  const submitButton = page.locator('#query-form button[type="submit"]');

  await queryInput.fill("g submit feedback");
  await queryInput.press("Enter");

  await expect(queryForm).toHaveClass(/is-submitting/);
  await expect(queryForm).toHaveAttribute("aria-busy", "true");
  await expect(submitButton).toBeDisabled();
  await expect(submitButton).toHaveAttribute("aria-label", "Processing query");
  await expect(queryInput).toBeFocused();
  await expect(queryForm.locator(".input-group")).toHaveCSS("position", "relative");
  const inputGroupStyles = await queryForm.locator(".input-group").evaluate((inputGroup) => {
    const shimmer = getComputedStyle(inputGroup, "::before");
    return {
      boxShadow: getComputedStyle(inputGroup).boxShadow,
      shimmerBackground: shimmer.backgroundImage,
      shimmerContent: shimmer.content,
      shimmerPosition: shimmer.position,
    };
  });
  expect(inputGroupStyles.boxShadow).not.toBe("none");
  expect(inputGroupStyles.shimmerContent).toBe('""');
  expect(inputGroupStyles.shimmerPosition).toBe("absolute");
  expect(inputGroupStyles.shimmerBackground).toContain("linear-gradient");

  resumeSubmitConfig?.();
  await page.waitForURL(/google\.co\.uk/);
  await page.goBack();
  await expect(page.locator('[data-page-loaded="true"]')).toBeVisible();
  await expect(queryForm).not.toHaveClass(/is-submitting/);
  await expect(queryForm).not.toHaveAttribute("aria-busy", "true");
  await expect(submitButton).not.toBeDisabled();
  await expect(submitButton).toHaveAttribute("aria-label", "Search");
  await expect(queryInput).toBeFocused();
});

test("Homepage in standalone mode should open external targets in a new window", async ({ page }) => {
  await page.addInitScript(() => {
    window.matchMedia = (query) => ({
      addEventListener() {},
      addListener() {},
      dispatchEvent() {
        return false;
      },
      matches: query === "(display-mode: standalone)",
      media: query,
      onchange: null,
      removeEventListener() {},
      removeListener() {},
    });
  });

  const mockGoogle = async (route) => {
    await route.fulfill({
      body: "<!doctype html><title>Google</title>",
      contentType: "text/html",
      status: 200,
    });
  };
  await page.route("https://www.google.co.uk/**", mockGoogle);
  await page.route("https://www.google.com/**", mockGoogle);

  await openLoadedHomepage(page);

  const popupPromise = page.waitForEvent("popup");
  const queryInput = page.locator("#query");
  const queryForm = page.locator("#query-form");

  await queryInput.fill("g submit feedback");
  await queryInput.press("Enter");

  const popup = await popupPromise;
  await expect(popup).toHaveURL(/google\.co\.uk/);
  await expect(queryInput).toHaveValue("g submit feedback");
  await expect(queryForm).not.toHaveClass(/is-submitting/);
});

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

    test("should render icons from the stylesheet", async ({ page }) => {
      const content = await page.locator(".fa-caret-right").evaluate((element) => {
        return getComputedStyle(element, "::before").content;
      });
      expect(content).not.toMatch(/^(none|normal)$/);
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

  test("should update the not_found query after another invalid submit", async ({ page }) => {
    await openLoadedHomepage(page, "#country=gb&language=de&query=google&status=not_found");
    await page.locator("#query").fill("wikipedia");
    await page.locator("#query").press("Enter");
    await expect(page).toHaveURL(/query=wikipedia/);
    await expect(page.locator("#query")).toHaveValue("wikipedia");
    await expect(page.getByText("No matching shortcut found.")).toBeVisible();
  });

  test("should prefill the alternative query for deprecated shortcuts", async ({ page }) => {
    await openLoadedHomepage(
      page,
      "#country=gb&language=en&query=oldshortcut&status=deprecated&alternative=g%20berlin",
    );
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
