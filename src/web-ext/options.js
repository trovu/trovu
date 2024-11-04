function fetchLocalJson(path) {
  return fetch(browser.runtime.getURL(path)).then((response) => response.json());
}
document.addEventListener("DOMContentLoaded", async function () {
  const [languageSelect, countrySelect, githubInput, saveOptionsButton] = [
    "language",
    "country",
    "github-username",
    "save-options",
  ].map(document.getElementById.bind(document));

  const languages = await fetchLocalJson("/json/languages.en.min.json");
  Object.entries(languages).forEach(([code, name]) => {
    languageSelect.appendChild(new Option(name, code));
  });

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
