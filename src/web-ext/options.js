document.addEventListener("DOMContentLoaded", function () {
  const languageSelect = document.getElementById("language");
  const countrySelect = document.getElementById("country");
  const githubInput = document.getElementById("github-username");
  const saveOptionsButton = document.getElementById("save-options");

  browser.storage.local.get(["language", "country", "githubUsername"]).then(function (result) {
    languageSelect.value = result.language || "en";
    countrySelect.value = result.country || "US";
    githubInput.value = result.githubUsername || "";
  });

  saveOptionsButton.addEventListener("click", function () {
    const language = languageSelect.value;
    const country = countrySelect.value;
    const github = githubInput.value;

    browser.storage.local.set({
      language: language,
      country: country,
      github: github,
    });
  });
});
