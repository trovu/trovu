import { detect, browserName } from "detect-browser";
import BSN from "bootstrap.native/dist/bootstrap-native.esm.min.js";

import "bootstrap/dist/css/bootstrap.css";
import "./scss/style.scss";

import Helper from "./helper.js";
import Env from "./env.js";
import Suggestions from "./suggestions";
import Settings from "./settings.js";

var env = new Env();

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
 * Add Opensearch tag.
 */
function addLinkSearch() {
  const paramStr = location.hash.substr(1);
  const xml = `<link 
    rel="search" 
    type="application/opensearchdescription+xml" 
    href="/opensearch/?${paramStr}" 
    title="Trovu" 
    />`;
  const head = document.querySelector("head");
  head.innerHTML += xml;
}

/**
 * Autoselect the right tab, based on current browser.
 */
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

/**
 * Initialize the index page.
 */
async function initialize() {
  // Must be done before env.populate()
  // otherwise Chrome does not autodiscover.
  addLinkSearch();

  // Init environment.
  await env.populate();

  showInfoAlerts();

  new Settings(env);

  setProcessUrlTemplateTextarea();

  const paramStr = env.getParamStr();
  window.location.hash = "#" + paramStr;

  // Set query into input.
  document.querySelector("#query").value = env.query || "";

  new Suggestions(env.namespaces, submitQuery);
  setAddToBrowserTab();

  document.querySelector("#query").focus();
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

/**
 * Set the textarea in the "Add to browser" modal.
 */
function setProcessUrlTemplateTextarea() {
  const baseUrl = getBaseUrl();
  const params = env.getParams();

  // Set Process URL.
  const urlProcess =
    baseUrl + "process#" + Helper.getUrlParamStr(params) + "&query=%s";
  const preProcessUrl = document.querySelector(".process-url");

  preProcessUrl.textContent = urlProcess;
}

document.querySelector("body").onload = initialize;
document.getElementById("query-form").onsubmit = submitQuery;