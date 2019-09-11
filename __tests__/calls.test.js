const docroot = "http://l.tro/process/index.html?#debug=1";

const yaml = require("js-yaml");
const fs = require("fs");

const calls = yaml.safeLoad(fs.readFileSync("./__tests__/calls.yml", "utf8"));

for (let call of calls) {
  test(JSON.stringify(call), async () => {
    let url = docroot;
    for (let paramName of ["language", "country", "github", "query"]) {
      if (paramName in call) {
        url += "&" + paramName + "=" + encodeURIComponent(call[paramName]);
      }
    }
    await page.goto(url);
    await page.reload();
    await page.waitForFunction(
      'document.querySelector("body").innerText.includes("Redirect to:")'
    );
    await expect(page.content()).resolves.toMatch(call.expectedRedirectUrl.replace(/&/g, "&amp;"));
  });
}
