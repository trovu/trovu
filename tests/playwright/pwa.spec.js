const { test, expect } = require("@playwright/test");

const baseUrl = "http://127.0.0.1:8081";

async function loadManifest(request) {
  const response = await request.get("/site.webmanifest");
  expect(response.ok()).toBe(true);
  return response.json();
}

function resolveManifestUrl(src) {
  return new URL(src, baseUrl);
}

async function expectManifestImageResponse(request, src) {
  const imageUrl = resolveManifestUrl(src);
  const requestUrl = imageUrl.origin === baseUrl ? `${imageUrl.pathname}${imageUrl.search}` : imageUrl.href;
  const response = await request.get(requestUrl);
  expect(response.status(), src).toBe(200);
  return response;
}

test("PWA manifest should declare store-compatible assets", async ({ page, request }) => {
  const manifest = await loadManifest(request);

  expect(manifest.prefer_related_applications).toBe(false);
  expect(manifest.display_override).toEqual(["standalone"]);
  expect(manifest).not.toHaveProperty("scope_extensions");

  for (const icon of manifest.icons) {
    const iconUrl = resolveManifestUrl(icon.src);
    expect(iconUrl.pathname.endsWith(".ico"), icon.src).toBe(false);
    await expectManifestImageResponse(request, icon.src);
  }

  for (const screenshot of manifest.screenshots) {
    const response = await expectManifestImageResponse(request, screenshot.src);
    expect(screenshot.type).toBe("image/jpeg");
    expect(response.headers()["content-type"]).toContain("image/jpeg");

    const [expectedWidth, expectedHeight] = screenshot.sizes.split("x").map(Number);
    const screenshotUrl = resolveManifestUrl(screenshot.src);
    const dimensions = await page.evaluate(
      (src) =>
        new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => {
            resolve({
              width: image.naturalWidth,
              height: image.naturalHeight,
            });
          };
          image.onerror = reject;
          image.src = src;
        }),
      screenshotUrl.href,
    );

    expect(dimensions).toEqual({
      width: expectedWidth,
      height: expectedHeight,
    });
  }
});

test("Homepage should register the service worker", async ({ page }) => {
  await page.goto("/");

  const scriptURL = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) {
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    return registration.active?.scriptURL ?? null;
  });

  expect(scriptURL).toBe(`${baseUrl}/service-worker.js`);
});
