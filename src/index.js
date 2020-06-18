import jsyaml from "js-yaml";

import Helper from "./helper.js";
import Env from "./env.js";
import ProcessUrl from "./processUrl.js";

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
  let paramStr = Helper.jqueryParam(params);
  return paramStr;
}

/**
 * Get the URL to the Process script.
 */
function getProcessUrl() {

  let params = getParams();
  params["query"] = document.getElementById("query").value;

  let paramStr = Helper.jqueryParam(params);
  let processUrl = "process/index.html?#" + paramStr;

  return processUrl;
}

async function getSuggestions() {
  // Use global var
  // reset it.
  suggestions = [];
  let foundShortcuts = {};
  // Iterate over namespaces in reverse order.
  for (let namespace of env.namespaces.reverse()) {
    let shortcuts = namespace.shortcuts;
    for (let key in shortcuts) {
      let suggestion = {};
      [suggestion.keyword, suggestion.argumentCount] = key.split(" ");
      suggestion.namespace = namespace.name;
      suggestion.arguments = ProcessUrl.getArgumentsFromString(
        shortcuts[key].url
      );
      suggestion.title = shortcuts[key].title || "";
      // If not yet present: reachable.
      // (Because we started with most precendent namespace.)
      if (!(key in foundShortcuts)) {
        suggestion.reachable = true;
        suggestions.push(suggestion);
      }
      // Others are unreachable
      // but can be reached with namespace forcing.
      else {
        suggestion.reachable = false;
        suggestions.push(suggestion);
      }
      foundShortcuts[key] = true;
    }
  }
  return suggestions;
}

async function initialize() {
  // Init environment.
  await env.populate();

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

  updateConfig();

  // Set query into input.
  document.querySelector("#query").value = env.query || "";

  setAutocomplete();

  $("#query").focus();
}

function setAutocomplete() {
  $("#query")
    .autocomplete({
      minLength: 1,
      source: function (request, response) {
        let matches = {
          keywordFullReachable: [],
          keywordFullUnreachable: [],
          keywordBeginReachable: [],
          keywordBeginUnreachable: [],
          titleBeginReachable: [],
          titleBeginUnreachable: [],
          titleMiddleReachable: [],
          titleMiddleUnreachable: [],
        };

        // Only use first word of request.term.
        let keyword, argumentString;
        [keyword, argumentString] = Helper.splitKeepRemainder(
          request.term,
          " ",
          2
        );

        for (let suggestion of suggestions) {
          if (keyword == suggestion.keyword) {
            if (suggestion.reachable) {
              matches.keywordFullReachable.push(suggestion);
            }
            else {
              matches.keywordFullReachable.push(suggestion);
            }
            continue;
          }
          let pos = suggestion.keyword.search(new RegExp(keyword, "i"));
          if (pos == 0) {
            if (suggestion.reachable) {
              matches.keywordBeginReachable.push(suggestion);
            }
            else {
              matches.keywordBeginUnreachable.push(suggestion);
            }
            continue;
          }
          pos = suggestion.title.search(new RegExp(keyword, "i"));
          if (pos == 0) {
            if (suggestion.reachable) {
              matches.titleBeginReachable.push(suggestion);
            }
            else {
              matches.titleBeginUnreachable.push(suggestion);
            }
            continue;
          }
          if (pos > 0) {
            if (suggestion.reachable) {
              matches.titleMiddleReachable.push(suggestion);
            }
            else {
              matches.titleMiddleUnreachable.push(suggestion);
            }
            continue;
          }
        }
        let result = [];
        result = result
          .concat(
            matches.keywordFullReachable,
            matches.keywordFullUnreachable,
            matches.keywordBeginReachable,
            matches.keywordBeginUnreachable,
            matches.titleBeginReachable,
            matches.titleBeginUnreachable,
            matches.titleMiddleReachable,
            matches.titleMiddleUnreachable
          )
          .slice(0, 20);
        response(result);
      },
    })
    .data("uiAutocomplete")._renderItem = function (ul, item) {
      var namespace_html = '<span class="namespace">' + item.namespace;
      ("</span>");

      var keyword = item.keyword;

      // add "namespace." if unreachable
      if (!item.reachable) {
        keyword = item.namespace + "." + keyword;
      }
      var argument_names = Object.keys(item.arguments).join(", ");
      var title = item.title;

      var html = "<a" +
        (item.reachable ? "" : " class='unreachable'") +
        ">" +
        "&nbsp;" + // to make bar visible /float:-related problem
        '<span class="float-left">' +
        '<span class="keyword">' +
        keyword +
        "</span>" +
        '<span class="argument-names">' +
        argument_names +
        "</span>" +
        "</span>" +
        '<span class="float-right">' +
        '<span class="title">' +
        title +
        "</span>" +
        namespace_html +
        "</span>" +
        "</a>" +
        "";

      return $("<li></li>")
        .data("item.autocomplete", item)
        .append(html)
        .appendTo(ul);
    };
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

/**
 * Add search provider to browser.
 */
function addSearch() {
  let urlOpensearch = document
    .querySelector("#linkSearch")
    .getAttribute("href");
  window.external.AddSearchProvider(urlOpensearch);
}

function saveSettings() {
  env.language = document.querySelector("#languageSetting").value;
  env.country = document.querySelector("#countrySetting").value;

  updateConfig();
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
    document.querySelectorAll(".github-config-link").forEach(
      (el) => el.href = env.configUrlTemplate.replace("{%github}", env.github)
    );
  } else {
    document.querySelector(".using-basic").classList.remove("d-none");
    document.querySelector(".using-advanced").classList.add("d-none");
    document.querySelector("#github-note").classList.add("d-none");
  }
}

/**
 * Set attributes of <link rel="search" ...>.
 */
function setLinkSearchAttributes() {

  let baseUrl = getBaseUrl();
  let params = getParams();

  let urlOpensearch = baseUrl + "opensearch/?" + Helper.jqueryParam(params);
  let linkSearch = document.querySelector("#linkSearch");

  let title = "Trovu: ";
  if (env.github) {
    title += env.github;
  } else {
    title += env.namespaces.join(",");
  }

  linkSearch.setAttribute("title", title);
  linkSearch.setAttribute("href", urlOpensearch);
}

/**
 * Set the textarea in the "Add to browser" modal.
 */
function setProcessUrlTemplateTextarea(){

  let baseUrl = getBaseUrl();
  let params = getParams();

  // Set Process URL.
  let urlProcess =
    baseUrl + "process#" + Helper.jqueryParam(params) + "&query=%s";
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

/**
 * Update the whole config.
 */
async function updateConfig() {

  await setDefaultNamespaces();
  await getSuggestions();

  displaySettings();

  setLinkSearchAttributes();
  setProcessUrlTemplateTextarea();

  let paramStr = getParamStr();
  window.location.hash = "#" + paramStr;
}

document.querySelector("body").onload = initialize;
document.getElementById("query-form").onsubmit = submitQuery;
document.querySelector("button.add-search").onclick = addSearch;
document.querySelector("#settingsSave").onclick = saveSettings;

// On Settings modal open.
$("#settingsModal").on("show.bs.modal", function (e) {
  displaySettings();
});
