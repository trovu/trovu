/** @module Home */
import "../../scss/style.scss";
import CallHandler from "./CallHandler";
import Env from "./Env";
import GitLogger from "./GitLogger";
import Settings from "./home/Settings";
import Suggestions from "./home/Suggestions";
import "@fortawesome/fontawesome-free/js/all.min";
import type { EnvParams, RedirectResponse } from "../types";

/* eslint-disable no-unused-vars */
import * as BSN from "bootstrap.native";
import "bootstrap/dist/css/bootstrap.css";
import countriesList from "countries-list";

/** Set and manage the homepage. */

export default class Home {
  env!: Env;
  queryInput!: HTMLInputElement;
  suggestions!: Suggestions;

  constructor() {}

  async initialize() {
    this.env = new Env({ context: "index" });
    const queryInput = document.querySelector<HTMLInputElement>("#query");
    if (!queryInput) {
      throw new Error('Missing element "#query".');
    }
    this.queryInput = queryInput;
    this.env.setContext();

    // Init environment.
    const params = Env.getParamsFromUrl();
    await this.env.populate(params);
    this.updateOpensearch();

    const gitLogger = new GitLogger(this.env.gitInfo);
    document.querySelector("#version").textContent = gitLogger.getVersion();
    gitLogger.logVersion();

    const modalElement = document.getElementById("settings");
    if (!modalElement) {
      throw new Error('Missing element "#settings".');
    }
    const modal = new BSN.Modal(modalElement);

    new Settings(this.env, this.updateOpensearch);

    this.showInfoAlerts();
    this.setLocationHash();
    this.setQueryElement();

    // Toggle by query only after the query input is set.
    this.toggleByQuery();

    if (this.env.debug) {
      this.env.logger.showLog();
    }

    const queryForm = document.getElementById("query-form") as HTMLFormElement | null;
    if (queryForm) {
      queryForm.onsubmit = this.submitQuery;
    }
    const reloadLink = document.querySelector<HTMLAnchorElement>("#reload");
    if (reloadLink) {
      reloadLink.href = this.env.buildProcessUrl({
        query: "reload",
      });
    }
    document.documentElement.setAttribute("data-page-loaded", "true");

    Home.setHeights();
    this.setListeners();
    window.addEventListener(
      "hashchange",
      function () {
        window.location.reload();
      },
      false,
    );
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) {
        // If true, the page was loaded from cache
        const queryElement = document.getElementById("query") as HTMLInputElement | null;
        queryElement?.focus();
      }
    });
  }

  static setHeights() {
    Home.setMaxHeightForSuggestions();
    window.onresize = Home.setMaxHeightForSuggestions;
  }

  static setMaxHeightForSuggestions() {
    const suggestionsDiv = document.querySelector<HTMLElement>("#suggestions");
    if (!suggestionsDiv) {
      return;
    }
    // Fallback value.
    suggestionsDiv.style.maxHeight = "200px";
    const suggestionsTop = suggestionsDiv.getBoundingClientRect().top;
    const footer = document.querySelector<HTMLElement>("footer");
    let footerTop;
    if (!footer || footer.style.display === "none") {
      footerTop = document.documentElement.clientHeight;
    } else {
      footerTop = footer.getBoundingClientRect().top;
    }
    suggestionsDiv.style.maxHeight = footerTop - suggestionsTop + "px";
  }

  setListeners() {
    this.setListenersToSetQuery("namespace", "ns");
    this.setListenersToSetQuery("tag", "tag");
  }
  setListenersToSetQuery(className: string, prefix: string) {
    const elements = document.querySelectorAll<HTMLSpanElement>(`span.${className}`);
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

    this.suggestions = new Suggestions("#query", "#suggestions", this);
    this.setToggleByQuery();
  }

  setToggleByQuery() {
    this.queryInput.addEventListener("input", () => {
      this.toggleByQuery();
    });
    const suggestions = document.querySelector<HTMLElement>("#suggestions");
    suggestions?.addEventListener("click", () => {
      this.toggleByQuery();
    });
    document.documentElement.style.display = "block";
    this.queryInput.focus();
  }

  toggleByQuery() {
    const nav = document.querySelector<HTMLElement>("nav.navbar");
    const footer = document.querySelector<HTMLElement>("footer");
    const settingsButton = document.querySelector<HTMLElement>("#settings-button");
    const lists = document.querySelector<HTMLElement>("#lists");
    const suggestions = document.querySelector<HTMLElement>("#suggestions");
    const help = document.querySelector<HTMLElement>("#help");
    // Toggle display of navbar and examples.
    if (this.queryInput.value.trim() === "" && (!this.suggestions || this.suggestions.selected === -1)) {
      if (nav) {
        nav.style.display = "block";
      }
      if (!this.env.isRunningStandalone() && this.env.context !== "web-ext") {
        if (footer) {
          footer.style.display = "block";
        }
        document.querySelectorAll<HTMLElement>(".explainer").forEach((el) => (el.style.display = "block"));
      }
      if (this.env.context === "web-ext") {
        if (settingsButton) {
          settingsButton.style.display = "none";
        }
      }
      if (lists) {
        lists.style.display = "block";
      }
      if (suggestions) {
        suggestions.style.display = "none";
      }
      if (help) {
        help.style.display = "none";
      }
    } else {
      if (nav) {
        nav.style.display = "none";
      }
      if (footer) {
        footer.style.display = "none";
      }
      if (suggestions) {
        suggestions.style.display = "block";
      }
      if (help) {
        help.style.display = "block";
      }
      document.querySelectorAll<HTMLElement>(".explainer").forEach((el) => (el.style.display = "none"));
      if (lists) {
        lists.style.display = "none";
      }
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
    const alert = document.querySelector<HTMLElement>("#alert");
    if (!alert) {
      return;
    }
    const alertMsg = alert.querySelector<HTMLSpanElement>("span");
    const alertClose = alert.querySelector<HTMLButtonElement>("button");
    if (!alertMsg || !alertClose) {
      return;
    }
    alertClose.addEventListener("click", () => {
      const paramStr = this.env.buildUrlParamStr({ query: undefined, status: undefined });
      window.location.hash = "#" + paramStr;
    });
    if (params.status) {
      alert.removeAttribute("hidden");
    }
    switch (params.status) {
      case "not_found":
        alertMsg.innerHTML = `No matching shortcut found. Did you use a <a href="${this.env.data.config.url.docs}users/#call-a-shortcut">keyword</a>? Try <a target="_blank" href="${this.env.data.config.url.docs}users/troubleshooting/">Troubleshooting</a>.`;
        break;
      case "not_reachable":
        alertMsg.innerHTML = `This shortcut is not <a target="_blank" href="${
          this.env.data.config.url.docs
        }shortcuts/namespaces/#priority-of-namespaces">reachable</a>.  Change your settings (${this.env.language.toUpperCase()} ${
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
          <a target="_blank" href="${this.env.data.config.url.docs}editors/policy/">Content policy</a>. 
          But you can <a target="_blank" href="${this.env.data.config.url.docs}users/advanced/">
          create a user shortcut in your own namespace</a>.`;
        const githubLink = alertMsg.querySelector<HTMLAnchorElement>("a.githubLink");
        if (!githubLink) {
          break;
        }
        githubLink.textContent = params.query || "";
        githubLink.href = `https://github.com/search?l=&q=${encodeURIComponent(
          params.key,
        )}+repo%3Atrovu%2Ftrovu-data&type=code`;
        break;
      case "suspicious":
        alertMsg.innerHTML =
          'This URL might be harmful, so the redirect was stopped. If you believe we should accept this URL, please <a target="_blank" href="https://github.com/trovu/trovu/issues/new">open an issue on Github</a>.';
        break;
    }
  }

  /**
   * On submitting the query.
   *
   * @param {object} event – The submitting event.
   */
  submitQuery = async (event?: Event) => {
    // Prevent default sending as GET parameters.
    if (event) {
      event.preventDefault();
    }

    // Must create new env instance here,
    // because extraNamespace might have changed reachability,
    // or asking for a not yet parsed Github namespace.
    const envQuery = new Env({ context: "index" });
    const params: EnvParams = Env.getParamsFromUrl();
    params.query = this.queryInput.value;
    await envQuery.populate(params);

    const response: RedirectResponse = CallHandler.getRedirectResponse(envQuery);

    // Send debug to /process.
    if (envQuery.debug) {
      const processUrl = this.env.buildProcessUrl({
        query: this.queryInput.value,
      });
      window.location.href = processUrl;
      return;
    }

    let redirectUrl: string;
    if (response.status === "found") {
      redirectUrl = response.redirectUrl as string;
      if (envQuery.isRunningStandalone()) {
        window.open(redirectUrl, "_blank");
        this.queryInput.value = "";
        this.toggleByQuery();
        return;
      }
    } else {
      redirectUrl = CallHandler.getRedirectUrlToHome(envQuery, response);
    }
    window.location.href = redirectUrl;
  };

  /**
   * On triggering reload
   *
   * @param {object} event – The submitting event.
   */
  reload = (event?: Event) => {
    if (event) {
      event.preventDefault();
    }
    this.queryInput.value = "reload";
    this.submitQuery();
  };

  /**
   * Add and update Opensearch tag.
   */
  updateOpensearch() {
    if (!this.env.language || !this.env.country) {
      return;
    }
    // Find link rel="search" and delete it if it exists
    const existingLinkSearch = document.querySelector('link[rel="search"]');
    if (existingLinkSearch) {
      existingLinkSearch.remove();
    }

    const linkSearch = document.createElement("link");
    linkSearch.id = "opensearch";
    linkSearch.rel = "search";
    linkSearch.type = "application/opensearchdescription+xml";

    let title = "Trovu: ";
    if (this.env.github) {
      title += this.env.github;
    } else if (this.env.configUrl) {
      title += this.env.configUrl;
    } else {
      // Set fallback values.
      this.env.language = this.env.language || "en";
      this.env.country = this.env.country || "us";
      title += this.env.language + "-" + this.env.country.toUpperCase();
      if (this.env.defaultKeyword) {
        title += " " + this.env.defaultKeyword;
      }
    }
    linkSearch.title = title;

    const paramsString = this.env.buildUrlParamStr();
    linkSearch.href = `/opensearch/?${paramsString}`;

    document.head.appendChild(linkSearch);
  }
}
