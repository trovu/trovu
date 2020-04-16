import Helper from "./helper.js";
import Env from "./env.js";
import ProcessUrl from "./processUrl.js";
var env = new Env();

var suggestions = [];

// Builders =========================================================

/**
 * Build the base URL of the current location.
 *
 * @return {string} - The built base URL.
 */
function buildBaseUrl() {
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
 * Build the params from env.
 *
 * @return {object} - The built params.
 */
function buildParams() {
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

async function getSuggestions() {
  // Use global var
  // reset it.
  suggestions = [];
  let foundShortcuts = {};

  // Prefetch suggestions.
  // Iterate over namespaces in reverse order.
  for (let namespace of env.namespaces.reverse()) {
    if (namespace.type != "site") {
      continue;
    }
    let yaml;
    try {
      // TODO: Do synchronous fetch().
      yaml = await Helper.fetchAsync(
        "https://raw.githubusercontent.com/trovu/trovu-data/one-yml-per-ns/shortcuts/" + namespace.name + ".yml"
      );
    } catch (e) {
      console.log(e);
    }
    if (!yaml) {
      continue;
    }
    let shortcuts = jsyaml.load(yaml);
    // Iterate over all shortcuts.
    for (let key in shortcuts) {
      let shortcut = {};
      [shortcut.keyword, shortcut.argumentCount] = key.split(' ');
      shortcut.namespace = namespace.name;
      shortcut.arguments = ProcessUrl.getArgumentsFromString(shortcuts[key].url);
      shortcut.title = shortcuts[key].title || '';
      // If not yet present: reachable.
      // (Because we started with most precendent namespace.)
      if (!(key in foundShortcuts)) {
        shortcut.reachable = true;
        suggestions.push(shortcut);
      }
      // Others are unreachable
      // but can be reached with namespace forcing.
      else {
        shortcut.reachable = false;
        suggestions.push(shortcut);
      }
      foundShortcuts[key] = true;
    }
  }
  return suggestions;
}

document.querySelector("body").onload = async function(event) {
  // Init environment.
  await env.populate();

  let params = Helper.getParams();

  // Show info alerts.
  switch (params.status) {
    case "not_found":
      document.querySelector("#alert").removeAttribute("hidden");
      document.querySelector("#alert").textContent =
        "Could not find a matching shortcut for this query.";
      break;
  }

  updateConfig();

  // Set query into input.
  document.querySelector("#query").value = env.query || "";

  $("#query")
    .autocomplete({
      minLength: 1,
      //source: ['one','two']
      source: function(request, response) {
        let matches = {
          keywordFullReachable: [],
          keywordFullUnreachable: [],
          keywordBeginReachable: [],
          keywordBeginUnreachable: [],
          titleBeginReachable: [],
          titleBeginUnreachable: [],
          titleMiddleReachable: [],
          titleMiddleUnreachable: []
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
            } else {
              matches.keywordFullReachable.push(suggestion);
            }
            continue;
          }
          let pos = suggestion.keyword.search(new RegExp(keyword, "i"));
          if (pos == 0) {
            if (suggestion.reachable) {
              matches.keywordBeginReachable.push(suggestion);
            } else {
              matches.keywordBeginUnreachable.push(suggestion);
            }
            continue;
          }
          pos = suggestion.title.search(new RegExp(keyword, "i"));
          if (pos == 0) {
            if (suggestion.reachable) {
              matches.titleBeginReachable.push(suggestion);
            } else {
              matches.titleBeginUnreachable.push(suggestion);
            }
            continue;
          }
          if (pos > 0) {
            if (suggestion.reachable) {
              matches.titleMiddleReachable.push(suggestion);
            } else {
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
      }
    })
    .data("uiAutocomplete")._renderItem = function(ul, item) {
    var namespace_html = '<span class="namespace">' + item.namespace;
    ("</span>");

    var keyword = item.keyword;

    // add "namespace." if unreachable
    if (!item.reachable) {
      keyword = item.namespace + "." + keyword;
    }
    var argument_names = Object.keys(item.arguments).join(", ");
    var title = item.title;

    var html =
      "<a" +
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
};

document.getElementById("query-form").onsubmit = function(event) {
  // Prevent default sending as GET parameters.
  event.preventDefault();

  let params = buildParams();
  params["query"] = document.getElementById("query").value;

  let paramStr = Helper.jqueryParam(params);
  let processUrl = "process/index.html?#" + paramStr;

  //console.log(processUrl);
  //return;

  // Redirect to process script.
  window.location.href = processUrl;
};

document.querySelector("button.add-search").onclick = function(event) {
  let urlOpensearch = document
    .querySelector("#linkSearch")
    .getAttribute("href");
  window.external.AddSearchProvider(urlOpensearch);
};

document.querySelector("#settingsSave").onclick = function(event) {
  env.language = document.querySelector("#languageSetting").value;
  env.country = document.querySelector("#countrySetting").value;

  updateConfig();
};

function displaySettings() {
  let params = Helper.getParams();

  // Set settings fields from environment.
  document.querySelector("#languageSetting").value = env.language;
  document.querySelector("#countrySetting").value = env.country;

  document.querySelector("#settingsEnv").value = jsyaml.dump(
    env.withoutMethods
  );

  if (env.github) {
    document.querySelector(".using-advanced").classList.remove("d-none");
    document.querySelector(".using-basic").classList.add("d-none");

    document.querySelector("#github-note").classList.remove("d-none");
    document.querySelector(
      "#github-note a"
    ).href = env.configUrlTemplate.replace("{%github}", env.github);
  } else {
    document.querySelector(".using-basic").classList.remove("d-none");
    document.querySelector(".using-advanced").classList.add("d-none");

    document.querySelector("#github-note").classList.add("d-none");
  }
}

async function updateConfig() {
  if (!env.github) {
    env.namespaces = ["o", env.language, "." + env.country];
    env.addFetchUrlToNamespaces();
    env.namespaces = await env.fetchShortcuts(env.namespaces);
  }

  await getSuggestions();

  displaySettings();

  let params = buildParams();
  let baseUrl = buildBaseUrl();
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

  // Set Process URL.
  let urlProcess =
    baseUrl + "process#" + Helper.jqueryParam(params) + "&query=%s";
  let preProcessUrl = document.querySelector(".process-url");

  preProcessUrl.textContent = urlProcess;

  let paramStr = Helper.jqueryParam(params);
  window.location.hash = "#" + paramStr;
}

// On Settings modal open.
$("#settingsModal").on("show.bs.modal", function(e) {
  displaySettings();
});
