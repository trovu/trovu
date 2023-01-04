/** @module Settings */

import jsyaml from 'js-yaml';
import countriesList from 'countries-list';

/** Settings methods. */

export default class Settings {
  constructor(env) {
    this.env = env;

    this.setLanguagesAndCountriesList();
    this.displaySettings();

    document.querySelector('#settingsSave').onclick = this.saveSettings;

    window.addEventListener(
      'hashchange',
      function () {
        location.reload();
      },
      false,
    );
  }

  /**
   * Fill in the fields of the settings modal.
   */
  displaySettings() {
    // Set settings fields from environment.
    document.querySelector('#languageSetting').value = this.env.language;
    document.querySelector('#countrySetting').value = this.env.country;

    // Output whole environment into textarea.
    document.querySelector('#settingsEnv').value = jsyaml.dump(
      this.env.withoutMethods,
    );

    // Show and hide settings tabs depending on Github setting.
    if (this.env.github) {
      document.querySelector('.using-advanced').classList.remove('d-none');
      document.querySelector('.using-basic').classList.add('d-none');
    } else {
      document.querySelector('.using-basic').classList.remove('d-none');
      document.querySelector('.using-advanced').classList.add('d-none');
    }
  }

  saveSettings = () => {
    this.env.language = document.querySelector('#languageSetting').value;
    this.env.country = document.querySelector('#countrySetting').value;

    const paramStr = this.env.getParamStr();
    window.location.hash = '#' + paramStr;
  };

  setLanguagesAndCountriesList() {
    const { countries, languages } = countriesList;

    // Convert to array.
    const languagesArray = this.objectToArrayWithKey(languages);
    const countriesArray = this.objectToArrayWithKey(countries);

    // Sort by name.
    languagesArray.sort((a, b) => (a.name < b.name ? -1 : 1));
    countriesArray.sort((a, b) => (a.name < b.name ? -1 : 1));

    this.setSelectOptions('#languageSetting', languagesArray);
    this.setSelectOptions('#countrySetting', countriesArray);
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
      selectEl.appendChild(
        new Option(
          `${item.name} ${item.emoji ? item.emoji : ``}`,
          item.key.toLocaleLowerCase(),
        ),
      ),
    );
  }
}
