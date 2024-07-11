/** @module Home */
import "../../scss/style.scss";
import Env from "./Env.js";
import GitLogger from "./GitLogger.js";
import Settings from "./home/Settings.js";
import Suggestions from "./home/Suggestions.js";

/* eslint-disable no-unused-vars */
import BSN from "bootstrap.native/dist/bootstrap-native.esm.min.js";
import "bootstrap/dist/css/bootstrap.css";
import countriesList from "countries-list";
import "font-awesome/css/font-awesome.min.css";

/** Set and manage the homepage. */

export default class Home {
  constructor() {}

  async initialize() {
    // Must be done before env.populate()
    // otherwise Chrome does not autodiscover.
    this.addLinkSearch();

    this.env = new Env({ context: "browser" });

    // Init environment.
    await this.env.populate();

    const gitLogger = new GitLogger(this.env.gitInfo);
    document.querySelector("#version").textContent = gitLogger.getVersion();
    gitLogger.logVersion();

    this.queryInput = document.querySelector("#query");

    if (this.env.isRunningStandalone()) {
      document.querySelector("footer").style.display = "none";
    }

    new Settings(this.env);

    this.showInfoAlerts();
    this.setLocationHash();
    this.setQueryElement();

    if (this.env.debug) {
      this.env.logger.showLog();
    }

    document.getElementById("query-form").onsubmit = this.submitQuery;
    document.querySelector("#reload").href = this.env.buildProcessUrl({
      query: "reload",
    });
    document.documentElement.setAttribute("data-page-loaded", "true");

    Home.setHeights();
    this.setListeners();
    this.toggleByQuery();
  }

  static setHeights() {
    Home.setMaxHeightForSuggestions();
    window.onresize = Home.setMaxHeightForSuggestions;
  }

  static setMaxHeightForSuggestions() {
    const suggestionsDiv = document.querySelector("#suggestions");
    // Fallback value.
    suggestionsDiv.style.maxHeight = "200px";
    const suggestionsTop = document.querySelector("#suggestions").getBoundingClientRect().top;
    let footerTop;
    if (document.querySelector("footer").style.display === "none") {
      footerTop = document.documentElement.clientHeight;
    } else {
      footerTop = document.querySelector("footer").getBoundingClientRect().top;
    }
    suggestionsDiv.style.maxHeight = footerTop - suggestionsTop + "px";
  }

  setListeners() {
    this.setListenersToSetQuery("namespace", "ns");
    this.setListenersToSetQuery("tag", "tag");
  }
  setListenersToSetQuery(className, prefix) {
    const elements = document.querySelectorAll(`span.${className}`);
    elements.forEach((element) => {
      element.style.cursor = "pointer";
      element.addEventListener("click", () => {
        this.queryInput.value = `${prefix}:${element.textContent}`;
        this.suggestions.updateSuggestions();
        this.toggleByQuery();
        this.queryInput.focus();
      });
    });
  }

  setQueryElement() {
    switch (this.env.status) {
      case "deprecated":
        this.queryInput.value = this.env.alternative;
        break;
      case "reloaded":
        this.queryInput.value = "";
        break;
      default:
        this.queryInput.value = this.env.query || "";
        break;
    }

    this.suggestions = new Suggestions("#query", "#suggestions", this.env);
    this.setToggleByQuery();
  }

  setToggleByQuery() {
    this.queryInput.focus();
    this.queryInput.addEventListener("input", () => {
      this.toggleByQuery();
    });
    document.querySelector("#suggestions").addEventListener("click", () => {
      this.toggleByQuery();
    });
  }

  toggleByQuery() {
    // Toggle display of navbar and examples.
    if (this.queryInput.value.trim() === "" && this.suggestions.selected === -1) {
      document.querySelector("nav.navbar").style.display = "block";
      if (!this.env.isRunningStandalone()) {
        document.querySelector("footer").style.display = "block";
        document.querySelector("#explainer").style.display = "block";
        document.querySelector("#intro").style.display = "block";
      }
      document.querySelector("#lists").style.display = "block";
      document.querySelector("#suggestions").style.display = "none";
      document.querySelector("#help").style.display = "none";
    } else {
      document.querySelector("nav.navbar").style.display = "none";
      document.querySelector("#intro").style.display = "none";
      document.querySelector("footer").style.display = "none";
      document.querySelector("#suggestions").style.display = "block";
      document.querySelector("#help").style.display = "block";
      document.querySelector("#explainer").style.display = "none";
      document.querySelector("#lists").style.display = "none";
    }
    Home.setHeights();
  }

  setLocationHash() {
    const paramStr = this.env.buildUrlParamStr();
    window.location.hash = "#" + paramStr;
  }

  /**
   * Show custom alerts above query input.
   */
  showInfoAlerts() {
    const params = Env.getParamsFromUrl();
    const alert = document.querySelector("#alert");
    const alertMsg = alert.querySelector("span");
    const alertClose = alert.querySelector("button");
    alertClose.addEventListener("click", () => {
      const paramStr = this.env.buildUrlParamStr({ status: "" });
      window.location.hash = "#" + paramStr;
    });
    if (params.status) {
      alert.removeAttribute("hidden");
    }
    switch (params.status) {
      case "not_found":
        alertMsg.innerHTML =
          'No matching shortcut found. Did you use a <a href="https://trovu.net/docs/">keyword</a>? Try <a target="_blank" href="/docs/users/troubleshooting/">Troubleshooting</a>. ';
        break;
      case "not_reachable":
        alertMsg.innerHTML = `This shortcut is not <a target="_blank" href="https://trovu.net/docs/shortcuts/namespaces/#priority-of-namespaces">reachable</a>.  Change your settings (${this.env.language.toUpperCase()} ${
          countriesList.countries[this.env.country.toUpperCase()].emoji
        }) to <span class="namespace"></span>.`;
        alertMsg.querySelector(".namespace").textContent = params.namespace;
        break;
      case "reloaded":
        alertMsg.textContent = "Shortcuts were reloaded in all namespaces.";
        if (this.env.github) {
          alertMsg.innerHTML +=
            " Changes on your GitHub might require a reload in <strong>5 minutes</strong> due to caching.";
        }
        break;
      case "deprecated":
        alertMsg.innerHTML = 'Your shortcut <strong><em class="query"></em></strong> is deprecated. Please use:';
        alertMsg.querySelector(".query").textContent = params.query;
        break;
      case "removed":
        alertMsg.innerHTML = `The shortcut <a class="githubLink" target="_blank" href=""></a> was removed as does not adhere to our 
          <a target="_blank" href="/docs/editors/policy/">Content policy</a>. 
          But you can <a target="_blank" href="/docs/users/advanced/">
          create a user shortcut in your own namespace</a>.`;
        alertMsg.querySelector("a.githubLink").textContent = params.query;
        alertMsg.querySelector("a.githubLink").href = `https://github.com/search?l=&q=${encodeURIComponent(
          params.key,
        )}+repo%3Atrovu%2Ftrovu-data&type=code`;
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
    const processUrl = this.env.buildProcessUrl({
      query: this.queryInput.value,
    });
    // Redirect to process script.
    window.location.href = processUrl;
  };

  /**
   * On triggering reload
   *
   * @param {object} event – The submitting event.
   */
  reload = (event) => {
    if (event) {
      event.preventDefault();
    }
    this.queryInput.value = "reload";
    this.submitQuery();
  };

  /**
   * Add Opensearch tag.
   */
  addLinkSearch() {
    // Cannot use
    // this.env.buildUrlParamStr();
    // because populate() has not run yet.
    const params = new URLSearchParams(location.hash.substring(1));

    // Only keep relevant parameters.
    for (const [key] of params.entries()) {
      if (!["configUrl", "country", "defaultKeyword", "github", "language"].includes(key)) {
        params.delete(key);
      }
    }

    const paramsString = params.toString();
    const link = document.createElement("link");
    link.rel = "search";
    link.type = "application/opensearchdescription+xml";
    link.href = `/opensearch/?${paramsString}`;
    link.title = "Trovu";

    document.head.appendChild(link);
  }
}
