const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/playwright",
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: "http://127.0.0.1:8081",
    locale: "en-GB",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run build && npm run dev-server",
    url: "http://127.0.0.1:8081/",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
