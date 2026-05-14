
/** @module Settings */
import countriesList from "countries-list";
import type { SettingsOption } from "../../types";
import type Env from "../Env";

/** Settings methods. */

export default class Settings {
  env: Env;
  updateOpensearch: () => void;

  constructor(env: Env, updateOpensearch: () => void) {
    this.env = env;
    this.updateOpensearch = updateOpensearch;

    this.setLanguagesAndCountriesList();
    this.displaySettings();

    document.querySelector("#settings")?.addEventListener("hidden.bs.modal", this.saveSettings);
  }

  /**
   * Update settings wherever they are displayed.
   */
  displaySettings() {
    // Set settings fields in navbar.
    const language = countriesList.languages[this.env.language];
    const navbarLanguage = document.querySelector<HTMLElement>(".navbar .language");
    if (navbarLanguage) {
      navbarLanguage.innerText = this.env.language;
      navbarLanguage.title = language.name;
    }

    const country = countriesList.countries[this.env.country.toUpperCase()];
    const navbarCountry = document.querySelector<HTMLElement>(".navbar .country");
    if (navbarCountry) {
      navbarCountry.innerText = country.emoji;
      navbarCountry.title = country.name;
    }

    // Set settings fields in settings modal.
    const languageSetting = document.querySelector<HTMLInputElement>("#languageSetting");
    const countrySetting = document.querySelector<HTMLInputElement>("#countrySetting");
    const githubSetting = document.querySelector<HTMLInputElement>("#githubSetting");
    if (languageSetting) languageSetting.value = this.env.language;
    if (countrySetting) countrySetting.value = this.env.country;
    if (githubSetting) githubSetting.value = this.env.github || "";

    // Show and hide settings tabs depending on Github setting.
    const usingAdvanced = document.querySelector<HTMLElement>(".using-advanced");
    const usingBasic = document.querySelector<HTMLElement>(".using-basic");
    if (this.env.github) {
      usingAdvanced?.classList.remove("d-none");
      usingBasic?.classList.add("d-none");
    } else {
      usingBasic?.classList.remove("d-none");
      usingAdvanced?.classList.add("d-none");
    }
  }

  saveSettings = () => {
    const languageSetting = document.querySelector<HTMLInputElement>("#languageSetting");
    const countrySetting = document.querySelector<HTMLInputElement>("#countrySetting");
    const githubSetting = document.querySelector<HTMLInputElement>("#githubSetting");
    this.env.language = languageSetting?.value || this.env.language;
    this.env.country = countrySetting?.value || this.env.country;
    this.env.github = githubSetting?.value || "";

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

  objectToArrayWithKey(obj: Record<string, { name: string; emoji?: string }>): SettingsOption[] {
    const ar: SettingsOption[] = [];
    for (const [key, value] of Object.entries(obj)) {
      ar.push({ ...value, key });
    }
    return ar;
  }

  setSelectOptions(selector: string, list: SettingsOption[]) {
    const selectEl = document.querySelector<HTMLSelectElement>(selector);
    if (!selectEl) {
      return;
    }
    list.forEach((item) =>
      selectEl.appendChild(new Option(`${item.name} ${item.emoji ? item.emoji : ""}`, item.key.toLocaleLowerCase())),
    );
  }
}
