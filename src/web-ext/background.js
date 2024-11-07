browser.runtime.onInstalled.addListener(() => {
  browser.runtime.openOptionsPage();
});

browser.commands.onCommand.addListener(async function (command) {
  const settings = await browser.storage.local.get(["language", "country", "github"]);
  const params = {};
  if (settings.github) {
    params.github = settings.github;
  } else if (settings.configUrl) {
    params.configUrl = settings.configUrl;
  } else {
    params.country = settings.country || "us";
    params.language = settings.language || "en";
  }
  const paramsStr = new URLSearchParams(params).toString();
  if (command === "open_window") {
    browser.windows.create({ url: `https://trovu.net/#${paramsStr}` });
  }
  if (command === "open_tab") {
    browser.tabs.create({ url: `https://trovu.net/#${paramsStr}` });
  }
});
