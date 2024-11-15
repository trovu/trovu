if (typeof browser === "undefined") {
  // eslint-disable-next-line no-undef
  var browser = chrome;
}

function fetchLocalJson(path) {
  return fetch(browser.runtime.getURL(path)).then((response) => response.json());
}

document.addEventListener("DOMContentLoaded", async function () {
  const [languageSelect, countrySelect, githubInput, saveOptionsButton] = ["language", "country", "github", "save"].map(
    document.getElementById.bind(document),
  );

  // Set language and country options

  const languages = await fetchLocalJson("/json/languages.en.min.json");
  Object.entries(languages).forEach(([code, name]) => {
    languageSelect.appendChild(new Option(name, code));
  });
  const countries = await fetchLocalJson("/json/countries.en.min.json");
  Object.entries(countries).forEach(([code, name]) => {
    countrySelect.appendChild(new Option(name, code.toLowerCase()));
  });

  browser.storage.local.get(["language", "country", "github"]).then((settings) => {
    // Get the language and country of the user's browser
    const languageAndCountry = browser.i18n.getUILanguage();
    const [browserLanguage, browserCountry] = languageAndCountry.split("-");

    // Set values from or storage or browser settings.
    countrySelect.value = settings.country?.toLowerCase() || browserCountry?.toLowerCase() || "us";
    languageSelect.value = settings.language || browserLanguage || "en";

    githubInput.value = settings.github || "";
  });

  // List keyboard shortcuts
  browser.commands.getAll((commands) => {
    const KeyboardShortcutsElement = document.getElementById("keyboard-shortcuts");
    commands.forEach((command) => {
      if (command.shortcut === "") {
        return;
      }
      KeyboardShortcutsElement.appendChild(document.createElement("li")).innerHTML =
        `${command.description}: <strong>${command.shortcut}</strong>`;
    });
  });

  if (navigator.userAgent.includes("Chrome")) {
    document.querySelector(".chrome").style.display = "block";
  }
  if (navigator.userAgent.includes("Firefox")) {
    document.querySelector(".firefox").style.display = "block";
  }

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
    event.target.textContent = "Saved. You can close this tab now and use the keyboard shortcuts listed below.";
  });

  addCopyButtons();
});

// Function to add copy buttons next to each <code> element
function addCopyButtons() {
  const codeElements = document.querySelectorAll("code");
  codeElements.forEach((codeElement) => {
    const button = document.createElement("button");
    button.textContent = "Copy to Clipboard";
    button.onclick = () => {
      const text = codeElement.textContent;
      navigator.clipboard.writeText(text);
      button.textContent = "Copied!";
    };
    codeElement.parentNode.insertBefore(button, codeElement.nextSibling);
  });
}
