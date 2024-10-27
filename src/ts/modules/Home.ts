// @ts-nocheck

/** @module Home */
import "../../scss/style.scss";
import Env from "./Env";
import GitLogger from "./GitLogger";
import Settings from "./home/Settings";
import Suggestions from "./home/Suggestions";
import "@fortawesome/fontawesome-free/js/all.min";

/* eslint-disable no-unused-vars */
import * as BSN from "bootstrap.native";
import "bootstrap/dist/css/bootstrap.css";
import countriesList from "countries-list";

/** Set and manage the homepage. */

export default class Home {
  constructor() {}

  async initialize() {
    this.env = new Env({ context: "index" });

    // Init environment.
    await this.env.populate();
    this.updateOpensearch();

    const gitLogger = new GitLogger(this.env.gitInfo);
    document.querySelector("#version").textContent = gitLogger.getVersion();
    gitLogger.logVersion();

    this.queryInput = document.querySelector("#query");

    if (this.env.isRunningStandalone()) {
      document.querySelector("footer").style.display = "none";
    }

    const modalElement = document.getElementById("settings");
    const modal = new BSN.Modal(modalElement);

    new Settings(this.env, this.updateOpensearch);

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
    this.startTypewriter();
    window.addEventListener(
      "hashchange",
      function () {
        window.location.reload();
      },
      false,
    );
  }

  startTypewriter() {
    const typewriter = (text, description, j) => {
      if (j < text.length) {
        typewriterQueryEl.textContent += text.charAt(j);
        j++;
        setTimeout(() => {
          typewriter(text, description, j);
        }, 50);
      } else {
        setTimeout(() => {
          typewriterDescriptionEl.textContent = "→ " + description;
        }, 500);
      }
    };
    const typewriterQueryEl = document.querySelector("#typewriter .query");
    const typewriterDescriptionEl = document.querySelector("#typewriter .description");
    const examples = [
      {
        query: "g berlin",
        description: "Search Google for Berlin",
      },
      {
        query: "gm berlin",
        description: "Go to Google Maps for Berlin",
      },
      {
        query: "db berlin, hh",
        description: "Suche eine Bahnverbindung von Berlin nach Hamburg",
        config: {
          country: "de",
        },
      },
      {
        query: "cd praha, brno",
        description: "Hledej spojení na České dráhy z Prahy do Brna",
        config: {
          country: "cz",
        },
      },
      {
        query: "w berlin",
        description: "Go to the Wikipedia article about Berlin",
      },
      {
        query: "fr.w berlin",
        description: "Go to the French Wikipedia article about Berlin",
      },
      {
        query: "gd london, liverpool",
        description: "Search for a route on Google Directions from London to Liverpool",
      },
      {
        query: "gfl ber, ibiza, fr, 28",
        description: "Search on Google Flights for a flight from Berlin to Ibiza for next Friday, return on the 28th",
      },
      {
        query: "wg berlin",
        description: 'Search Wikipedia for all mentions of "berlin" via Google',
      },
      {
        query: "bkg berlin, fr, 28",
        description: "Search on Booking.com for a hotel in Berlin from next Friday until the 28th",
      },
      {
        query: "en tree",
        description: "Look up the word 'tree' in the English dictionary",
        config: {
          country: "de",
        },
      },
      {
        query: "owid fertility",
        description: "Look up stats on fertility at Our World in Data",
      },
      {
        query: "gr pinker",
        description: "Search on Goodreads for books by Steven Pinker",
      },
      {
        query: "npm csv",
        description: "Search the Node Package Manager for projects about CSV",
      },
      {
        query: "cve wordpress",
        description: "Search for Common vulnerabilities and exposures of Wordpress",
      },
      {
        query: "ec berlin",
        description: "Search Ecosia for Berlin",
      },
    ];
    let i = -1;
    const displayNextExample = () => {
      i++;
      if (i === examples.length) {
        i = 0;
      }
      if (examples[i].config) {
        if (examples[i].config.country && this.env.country !== examples[i].config.country) {
          displayNextExample();
          return;
        }
      }
      typewriterQueryEl.textContent = "";
      typewriterDescriptionEl.textContent = "";
      typewriter(examples[i].query, examples[i].description, 0);
      setTimeout(displayNextExample, examples[i].description.length * 100);
    };
    displayNextExample();
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
