import BSN from "bootstrap.native/dist/bootstrap-native.esm.min.js";

import "bootstrap/dist/css/bootstrap.css";
import "./scss/style.scss";

import Helper from "./helper.js";
import Env from "./env.js";
import Suggestions from "./suggestions";
import Settings from "./settings.js";
import AddToBrowser from "./addToBrowser.js";

var env = new Env();

// Builders =========================================================

/**
 * Get the URL to the Process script.
 */
function getProcessUrl() {
  const params = env.getParams();
  params["query"] = document.getElementById("query").value;

  const paramStr = Helper.getUrlParamStr(params);
  const processUrl = "process/index.html?#" + paramStr;

  return processUrl;
}

/**
 * Initialize the index page.
 */
async function initialize() {
  // Must be done before env.populate()
  // otherwise Chrome does not autodiscover.
  AddToBrowser.addLinkSearch();

  // Init environment.
  await env.populate();

  showInfoAlerts();

  new Settings(env);

  new AddToBrowser(env);

  setLocationHash();

  // Set query into input.
  document.querySelector("#query").value = env.query || "";

  new Suggestions(env.namespaces, submitQuery);

  document.querySelector("#query").focus();
}

function setLocationHash() {
  const paramStr = env.getParamStr();
  window.location.hash = "#" + paramStr;
}

/**
 * Show custom alerts above query input.
 */
function showInfoAlerts() {
  const params = Helper.getUrlParams();

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

/**
 * On submitting the query.
 *
 * @param {object} event – The submitting event.
 */
function submitQuery(event) {
  // Prevent default sending as GET parameters.
  if (event) {
    event.preventDefault();
  }

  const processUrl = getProcessUrl();

  // Redirect to process script.
  window.location.href = processUrl;
}

document.querySelector("body").onload = initialize;
document.getElementById("query-form").onsubmit = submitQuery;