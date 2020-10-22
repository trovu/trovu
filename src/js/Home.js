/** @module Home */

import BSN from "bootstrap.native/dist/bootstrap-native.esm.min.js";

import "bootstrap/dist/css/bootstrap.css";
import "../scss/style.scss";

import Helper from "./Helper.js";
import Env from "./Env.js";
import Suggestions from "./Suggestions";
import Settings from "./Settings.js";
import AddToBrowser from "./addToBrowser.js";

/** Set and manage the homepage. */

export default class Home {
  constructor() {
  }

  async initialize() {
    this.env = new Env();

    // Must be done before env.populate()
    // otherwise Chrome does not autodiscover.
    AddToBrowser.addLinkSearch();

    // Init environment.
    await this.env.populate();

    new Settings(this.env);
    new AddToBrowser(this.env);

    this.showInfoAlerts();
    this.setLocationHash();
    this.setQueryElement();

    document.getElementById("query-form").onsubmit = this.submitQuery;
  }

  /**
   * Get the URL to the Process script.
   */
  getProcessUrl() {
    const params = this.env.getParams();
    params["query"] = document.getElementById("query").value;

    const paramStr = Helper.getUrlParamStr(params);
    const processUrl = "process/index.html?#" + paramStr;

    return processUrl;
  }

  setQueryElement() {
    // Set query into input.
    document.querySelector("#query").value = this.env.query || "";
    new Suggestions(this.env.namespaces, this.submitQuery);
    document.querySelector("#query").focus();
  }

  setLocationHash() {
    const paramStr = this.env.getParamStr();
    window.location.hash = "#" + paramStr;
  }

  /**
   * Show custom alerts above query input.
   */
  showInfoAlerts() {
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
  submitQuery = (event) => {
    // Prevent default sending as GET parameters.
    if (event) {
      event.preventDefault();
    }

    const processUrl = this.getProcessUrl();

    // Redirect to process script.
    window.location.href = processUrl;
  }
}
