browser.commands.onCommand.addListener(function (command) {
  if (command === "open") {
    browser.tabs.create({ url: "https://trovu.net/" });
  }
});
