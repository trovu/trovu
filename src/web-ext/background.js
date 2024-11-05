browser.commands.onCommand.addListener(async function (command) {
  const settings = await browser.storage.local.get(["language", "country", "github"]);

  const params = {};
  if (settings.github) {
    params.github = this.github;
  } else if (settings.configUrl) {
    params.configUrl = settings.configUrl;
  } else {
    params.language = settings.language;
    params.country = settings.country.toLowerCase();
  }
  const paramsStr = new URLSearchParams(params).toString();
  if (command === "open") {
    browser.tabs.create({ url: `https://trovu.net/#${paramsStr}` });
  }
});
