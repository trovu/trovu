import jsyaml from "js-yaml";
import countriesList from "countries-list";
import { detect, browserName } from "detect-browser";
import BSN from "bootstrap.native/dist/bootstrap-native.esm.min.js";
import awesomplete from "awesomplete";

import "bootstrap/dist/css/bootstrap.css";
import "awesomplete/awesomplete.css";
import "./css/style.css";

import Helper from "./helper.js";
import Env from "./env.js";

var env = new Env();

var suggestions = [];

// Builders =========================================================

/**
 * Get the base URL of the current location.
 *
 * @return {string} - The built base URL.
 */
function getBaseUrl() {
  let baseUrl = "";

  baseUrl += window.location.protocol;
  baseUrl += "//";
  baseUrl += window.location.hostname;
  baseUrl += window.location.pathname;

  // Remove index.html.
  baseUrl = baseUrl.replace("index.html", "");

  return baseUrl;
}

/**
 * Get the params from env.
 *
 * @return {object} - The built params.
 */
function getParams() {
  let params = {};

  // Put environment into hash.
  if (env.github) {
    params["github"] = env.github;
  } else {
    params["language"] = env.language;
    params["country"] = env.country;
  }
  if (env.debug) {
    params["debug"] = 1;
  }

  return params;
}

/**
 * Get the parameters as string.
 */
function getParamStr() {
  let params = getParams();
  let paramStr = Helper.getUrlParamStr(params);
  return paramStr;
}

/**
 * Get the URL to the Process script.
 */
function getProcessUrl() {
  let params = getParams();
  params["query"] = document.getElementById("query").value;

  let paramStr = Helper.getUrlParamStr(params);
  let processUrl = "process/index.html?#" + paramStr;

  return processUrl;
}

function addLinkSearch() {
  let paramStr = location.hash.substr(1);
  let xml =
    '<link rel="search" type="application/opensearchdescription+xml" href="/opensearch/?' +
    paramStr +
    '" title="Trovu" />';
  let head = document.querySelector("head");
  head.innerHTML += xml;
}

function setAddToBrowserTab() {
  const browser = detect();

  // Deactivate all.
  document
    .querySelectorAll("#add-to-browser .nav-tabs a")
    .forEach((el) => el.classList.remove("active"));
  document
    .querySelectorAll("#add-to-browser .tab-pane")
    .forEach((el) => el.classList.remove("show", "active"));

  // Show tab and panel according to setting.
  switch (browser && browser.name) {
    case "firefox":
    case "chrome":
      document
        .querySelector("#add-to-browser .nav-tabs a." + browser.name)
        .classList.add("active");
      document
        .querySelector("#add-to-browser .tab-pane." + browser.name)
        .classList.add("show", "active");
      break;
    default:
      // Will show the default "Other" tab.
      break;
  }
}

async function initialize() {
  // Must be done before env.populate()
  // otherwise Chrome does not autodiscover.
  addLinkSearch();

  // Init environment.
  await env.populate();

  showInfoAlerts();
  setLanguagesAndCountriesList();
  displaySettings();
  setProcessUrlTemplateTextarea();

  let paramStr = getParamStr();
  window.location.hash = "#" + paramStr;

  // Set query into input.
  document.querySelector("#query").value = env.query || "";

  setAutocomplete();
  setAddToBrowserTab();

  document.querySelector("#query").focus();
}

function setLanguagesAndCountriesList() {
  const { countries, languages } = countriesList;
  setSelectOptions("#languageSetting", languages);
  setSelectOptions("#countrySetting", countries);
}

function setSelectOptions(selector, list) {
  let selectEl = document.querySelector(selector);
  Object.keys(list).forEach((key) =>
    selectEl.appendChild(new Option(list[key].name, key.toLocaleLowerCase()))
  );
}

function showInfoAlerts() {
  let params = Helper.getUrlParams();

  // Show info alerts.
  switch (params.status) {
    case "not_found":
      document.querySelector("#alert").removeAttribute("hidden");
      document.querySelector("#alert").textContent =
        "Could not find a matching shortcut for this query.";
      break;
    case "reloaded":
      document.querySelector("#alert").removeAttribute("hidden");
      document.querySelector("#alert").textContent =
        "Shortcuts were reloaded in all namespaces.";
      break;
  }
}

function setAutocomplete() {
  const queryInput = document.querySelector("#query");

  env.awesomplete = new Awesomplete(queryInput, {
    container: function (input) {
      return input.parentNode;
    },
    minChars: 1,
    filter: function (text, input) {
      return true;
    },
    list: [],
    item: function (listItem, input, id) {
      const li = document.createElement("li", {
        role: "option",
      });

      const argument_names = Object.keys(listItem.label.arguments).join(", ");

      li.innerHTML =
        `
        <span` +
        (listItem.label.reachable ? `` : ` class="unreachable"`) +
        `>
        <span class="float-left">  
        <span class="keyword">  
        ` +
        listItem.label.keyword +
        `
        </span>  
        <span class="argument-names">
        ` +
        argument_names +
        `
        </span> 
        </span>&nbsp;<span class="float-right">
          <span class="title">
          ` +
        listItem.label.title +
        `
          </span>
        <span class="namespace">` +
        listItem.label.namespace +
        `</span>
        </span></span>
        `;
      return li;
    },
  });

  queryInput.addEventListener("input", function (event) {
    const inputText = event.target.value;

    // Only use first word of user input
    let keyword, argumentString;
    [keyword, argumentString] = Helper.splitKeepRemainder(inputText, " ", 2);

    const matches = {
      keywordFullReachable: [],
      keywordFullUnreachable: [],
      keywordBeginReachable: [],
      keywordBeginUnreachable: [],
      titleBeginReachable: [],
      titleBeginUnreachable: [],
      titleMiddleReachable: [],
      titleMiddleUnreachable: [],
    };

    for (let namespace of env.namespaces) {
      for (let shortcut of Object.values(namespace.shortcuts)) {
        if (keyword == shortcut.keyword) {
          if (shortcut.reachable) {
            matches.keywordFullReachable.push(shortcut);
          } else {
            matches.keywordFullReachable.push(shortcut);
          }
          continue;
        }
        let pos = shortcut.keyword.search(new RegExp(keyword, "i"));
        if (pos == 0) {
          if (shortcut.reachable) {
            matches.keywordBeginReachable.push(shortcut);
          } else {
            matches.keywordBeginUnreachable.push(shortcut);
          }
          continue;
        }
        pos = shortcut.title.search(new RegExp(keyword, "i"));
        if (pos == 0) {
          if (shortcut.reachable) {
            matches.titleBeginReachable.push(shortcut);
          } else {
            matches.titleBeginUnreachable.push(shortcut);
          }
          continue;
        }
        if (pos > 0) {
          if (shortcut.reachable) {
            matches.titleMiddleReachable.push(shortcut);
          } else {
            matches.titleMiddleUnreachable.push(shortcut);
          }
          continue;
        }
      }
    }
    let suggestions = [];
    suggestions = suggestions.concat(
      matches.keywordFullReachable,
      matches.keywordFullUnreachable,
      matches.keywordBeginReachable,
      matches.keywordBeginUnreachable,
      matches.titleBeginReachable,
      matches.titleBeginUnreachable,
      matches.titleMiddleReachable,
      matches.titleMiddleUnreachable
    );
    suggestions = suggestions.slice(0, 10);

    const list = convertSuggestionsToAwesompleteList(suggestions);

    env.awesomplete.list = list.slice(0, 10);
    env.awesomplete.evaluate();
  });
}

function convertSuggestionsToAwesompleteList(suggestions) {
  const list = [];
  for (let suggestion of suggestions) {
    const item = {
      value: (suggestion.reachable ? "" : suggestion.namespace + ".") +
        suggestion.keyword +
        " ",
      label: suggestion,
    };
    list.push(item);
  }
  return list;
}

/**
 * On submitting the query.
 *
 * @param {object} event – The submitting event.
 */
function submitQuery(event) {
  // Prevent default sending as GET parameters.
  event.preventDefault();

  let processUrl = getProcessUrl();

  // Redirect to process script.
  window.location.href = processUrl;
}

function saveSettings() {
  env.language = document.querySelector("#languageSetting").value;
  env.country = document.querySelector("#countrySetting").value;

  let paramStr = getParamStr();
  window.location.hash = "#" + paramStr;

  // We need to reload to also let Chrome and Opera
  // catch the changes in <link rel="search">.
  location.reload();
}

/**
 * Fill in the fields of the settings modal.
 */
function displaySettings() {
  let params = Helper.getUrlParams();

  // Set settings fields from environment.
  document.querySelector("#languageSetting").value = env.language;
  document.querySelector("#countrySetting").value = env.country;

  // Output whole environment into textarea.
  document.querySelector("#settingsEnv").value = jsyaml.dump(
    env.withoutMethods
  );

  // Show and hide settings tabs depending on Github setting.
  if (env.github) {
    document.querySelector(".using-advanced").classList.remove("d-none");
    document.querySelector(".using-basic").classList.add("d-none");
    document.querySelector("#github-note").classList.remove("d-none");
    document
      .querySelectorAll(".github-config-link")
      .forEach(
        (el) =>
          (el.href = env.configUrlTemplate.replace("{%github}", env.github))
      );
  } else {
    document.querySelector(".using-basic").classList.remove("d-none");
    document.querySelector(".using-advanced").classList.add("d-none");
    document.querySelector("#github-note").classList.add("d-none");
  }
}

/**
 * Set the textarea in the "Add to browser" modal.
 */
function setProcessUrlTemplateTextarea() {
  let baseUrl = getBaseUrl();
  let params = getParams();

  // Set Process URL.
  let urlProcess =
    baseUrl + "process#" + Helper.getUrlParamStr(params) + "&query=%s";
  let preProcessUrl = document.querySelector(".process-url");

  preProcessUrl.textContent = urlProcess;
}

/**
 * Set namespaces to o, enviroment's language & country.
 */
async function setDefaultNamespaces() {
  if (!env.github) {
    env.namespaces = ["o", env.language, "." + env.country];
    env.addFetchUrlToNamespaces();
    env.namespaces = await env.fetchShortcuts(env.namespaces);
  }
}

document.querySelector("body").onload = initialize;
document.getElementById("query-form").onsubmit = submitQuery;
document.querySelector("#settingsSave").onclick = saveSettings;
