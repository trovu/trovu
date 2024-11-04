document.addEventListener("DOMContentLoaded", async function () {
  const [languageSelect, countrySelect, githubInput, saveOptionsButton] = [
    "language",
    "country",
    "github-username",
    "save-options",
  ].map(document.getElementById.bind(document));

  const response = await fetch(browser.runtime.getURL("/json/languages.en.min.json"));
  const languages = await response.json();
  for (const [code, name] of Object.entries(languages)) {
    console.log(code, name);
    const option = document.createElement("option");
    option.value = code;
    option.textContent = name;
    languageSelect.appendChild(option);
  }
  browser.storage.local.get(["language", "country", "github"]).then((result) => {
    languageSelect.value = result.language || "en";
    countrySelect.value = result.country || "US";
    githubInput.value = result.github || "";
  });

  saveOptionsButton.addEventListener("click", (event) => {
    event.preventDefault();
    browser.storage.local
      .set({
        language: languageSelect.value,
        country: countrySelect.value,
        github: githubInput.value,
      })
      .catch((error) => {
        console.error("Error saving options:", error);
        alert("Failed to save options.");
      });
  });
});
