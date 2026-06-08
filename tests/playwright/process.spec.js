const { test, expect } = require("@playwright/test");

test("Process startup should not wait for images", async ({ page }) => {
  let resumeIcon;
  await page.route("**/img/icon.svg", async (route) => {
    await new Promise((resolve) => {
      resumeIcon = resolve;
    });
    await route.continue();
  });

  await page.goto("/process/index.html?#country=gb&debug=1&language=en&query=g%20foo", {
    waitUntil: "domcontentloaded",
  });

  try {
    await expect(page.locator("#target-domain")).toContainText("https://www.google");
  } finally {
    resumeIcon?.();
  }

  await page.waitForLoadState("load");
});
