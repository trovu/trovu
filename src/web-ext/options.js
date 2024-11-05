function fetchLocalJson(path) {
  return fetch(browser.runtime.getURL(path)).then((response) => response.json());
}

document.addEventListener("DOMContentLoaded", async function () {
  const [languageSelect, countrySelect, githubInput, saveOptionsButton] = ["language", "country", "github", "save"].map(
    document.getElementById.bind(document),
  );

  const languages = await fetchLocalJson("/json/languages.en.min.json");
  Object.entries(languages).forEach(([code, name]) => {
    languageSelect.appendChild(new Option(name, code));
  });
  const countries = await fetchLocalJson("/json/countries.en.min.json");
  Object.entries(countries).forEach(([code, name]) => {
    countrySelect.appendChild(new Option(name, code));
  });

  browser.storage.local.get(["language", "country", "github"]).then((settings) => {
    countrySelect.value = settings.country ? settings.country.toUpperCase() : "US";
    languageSelect.value = settings.language || "en";
    githubInput.value = settings.github || "";
  });

  saveOptionsButton.addEventListener("click", (event) => {
    event.preventDefault();
    browser.storage.local
      .set({
        language: languageSelect.value,
        country: countrySelect.value.toLowerCase(),
        github: githubInput.value,
      })
      .catch((error) => {
        console.error("Error saving options:", error);
        alert("Failed to save options.");
      });
    event.target.textContent = "Saved!";
  });

  addCopyButtons();
});

// Function to copy text to clipboard
function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      alert("Copied to clipboard: " + text);
    })
    .catch((err) => {
      console.error("Could not copy text: ", err);
    });
}

// Function to add copy buttons next to each <code> element
function addCopyButtons() {
  const codeElements = document.querySelectorAll("code");
  codeElements.forEach((codeElement) => {
    const button = document.createElement("button");
    button.textContent = "Copy to Clipboard";
    button.onclick = () => copyToClipboard(codeElement.textContent);
    codeElement.parentNode.insertBefore(button, codeElement.nextSibling);
  });
}
