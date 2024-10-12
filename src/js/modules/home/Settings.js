/** @module Settings */
import countriesList from "countries-list";

/** Settings methods. */

export default class Settings {
  constructor(env, updateLinkSearch) {
    this.env = env;
    this.updateLinkSearch = updateLinkSearch;

    this.setLanguagesAndCountriesList();
    this.displaySettings();

    document.querySelector("#settings").addEventListener("hidden.bs.modal", this.saveSettings);

    window.addEventListener(
      "hashchange",
      () => {
        this.env.populate();
        this.displaySettings();
        this.updateLinkSearch();
      },
      false,
    );
  }

  /**
   * Update settings wherever they are displayed.
   */
  displaySettings() {
    // Set settings fields in navbar.
    const language = countriesList.languages[this.env.language];
    document.querySelector(".navbar .language").innerText = this.env.language;
    document.querySelector(".navbar .language").title = language.name;

    const country = countriesList.countries[this.env.country.toUpperCase()];
    document.querySelector(".navbar .country").innerText = country.emoji;
    document.querySelector(".navbar .country").title = country.name;

    // Set settings fields in settings modal.
    document.querySelector("#languageSetting").value = this.env.language;
    document.querySelector("#countrySetting").value = this.env.country;
    document.querySelector("#githubSetting").value = this.env.github || "";

    // Show and hide settings tabs depending on Github setting.
    if (this.env.github) {
      document.querySelector(".using-advanced").classList.remove("d-none");
      document.querySelector(".using-basic").classList.add("d-none");
    } else {
      document.querySelector(".using-basic").classList.remove("d-none");
      document.querySelector(".using-advanced").classList.add("d-none");
    }
  }

  saveSettings = () => {
    this.env.language = document.querySelector("#languageSetting").value;
    this.env.country = document.querySelector("#countrySetting").value;
    this.env.github = document.querySelector("#githubSetting").value;

    this.env.setToLocalStorage();

    const paramStr = this.env.buildUrlParamStr();
    window.location.hash = "#" + paramStr;
  };

  setLanguagesAndCountriesList() {
    const { countries, languages } = countriesList;

    // Convert to array.
    const languagesArray = this.objectToArrayWithKey(languages);
    const countriesArray = this.objectToArrayWithKey(countries);

    // Sort by name.
    languagesArray.sort((a, b) => (a.name < b.name ? -1 : 1));
    countriesArray.sort((a, b) => (a.name < b.name ? -1 : 1));

    this.setSelectOptions("#languageSetting", languagesArray);
    this.setSelectOptions("#countrySetting", countriesArray);
  }

  objectToArrayWithKey(obj) {
    const ar = [];
    for (const [key, value] of Object.entries(obj)) {
      value.key = key;
      ar.push(value);
    }
    return ar;
  }

  setSelectOptions(selector, list) {
    const selectEl = document.querySelector(selector);
    list.forEach((item) =>
      selectEl.appendChild(new Option(`${item.name} ${item.emoji ? item.emoji : ""}`, item.key.toLocaleLowerCase())),
    );
  }
}
