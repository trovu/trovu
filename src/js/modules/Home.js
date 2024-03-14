/** @module Home */
import '../../scss/style.scss';
import Env from './Env.js';
import Helper from './Helper.js';
import Settings from './home/Settings.js';
import Suggestions from './home/Suggestions.js';

/* eslint-disable no-unused-vars */
import BSN from 'bootstrap.native/dist/bootstrap-native.esm.min.js';
import 'bootstrap/dist/css/bootstrap.css';
import 'font-awesome/css/font-awesome.min.css';

/** Set and manage the homepage. */

export default class Home {
  constructor() {}

  async initialize() {
    Helper.logVersion();
    document.querySelector('#version').textContent = Helper.getVersion();

    // Must be done before env.populate()
    // otherwise Chrome does not autodiscover.
    this.addLinkSearch();

    this.env = new Env();

    // Init environment.
    await this.env.populate();

    this.helpDiv = document.querySelector('#help');
    this.queryInput = document.querySelector('#query');

    if (this.env.isRunningStandalone()) {
      document.querySelector('#intro').style.display = 'none';
      document.querySelector('footer').style.display = 'none';
    }

    new Settings(this.env);

    this.showInfoAlerts();
    this.setLocationHash();
    this.setQueryElement();

    if (this.env.debug) {
      this.env.logger.showLog();
    }

    document.getElementById('query-form').onsubmit = this.submitQuery;
    document.querySelector('#reload').href = this.env.getProcessUrl({
      query: 'reload',
    });
    document.documentElement.setAttribute('data-page-loaded', 'true');

    Home.setHeights();
  }

  static setHeights() {
    Home.setMaxHeightForSuggestions();
    window.onresize = Home.setMaxHeightForSuggestions;
  }

  static setMaxHeightForSuggestions() {
    const suggestionsDiv = document.querySelector('#suggestions');
    // Fallback value.
    suggestionsDiv.style.maxHeight = '200px';
    const suggestionsTop = document
      .querySelector('#suggestions')
      .getBoundingClientRect().top;
    let footerTop;
    if (document.querySelector('footer').style.display === 'none') {
      footerTop = document.documentElement.clientHeight;
    } else {
      footerTop = document.querySelector('footer').getBoundingClientRect().top;
    }
    suggestionsDiv.style.maxHeight = footerTop - suggestionsTop + 'px';
  }

  setQueryElement() {
    switch (this.env.status) {
      case 'deprecated':
        this.queryInput.value = this.env.alternative;
        break;
      case 'reloaded':
        this.queryInput.value = '';
        break;
      default:
        this.queryInput.value = this.env.query || '';
        break;
    }

    this.suggestions = new Suggestions('#query', '#suggestions', this.env);
    this.setToggleByQuery();
  }

  setToggleByQuery() {
    this.queryInput.focus();
    this.queryInput.addEventListener('input', () => {
      this.toggleByQuery();
    });
    document.querySelector('#suggestions').addEventListener('click', () => {
      this.toggleByQuery();
    });
  }

  toggleByQuery() {
    // Toggle display of navbar and examples.
    if (
      this.queryInput.value.trim() === '' &&
      this.suggestions.selected === -1
    ) {
      document.querySelector('nav.navbar').style.display = 'block';
      document.querySelector('#alert').style.display = 'block';
      if (!this.env.isRunningStandalone()) {
        document.querySelector('#intro').style.display = 'block';
        document.querySelector('footer').style.display = 'block';
      }
      this.helpDiv.innerHTML = '';
    } else {
      document.querySelector('nav.navbar').style.display = 'none';
      document.querySelector('#alert').style.display = 'none';
      document.querySelector('#intro').style.display = 'none';
      document.querySelector('footer').style.display = 'none';
      this.helpDiv.innerHTML =
        'Select with ⬆️ ⬇️ for examples, click on<span class="namespace">namespace</span>or <span class="tag">tag</span> to filter.';
    }
    Home.setHeights();
  }

  setLocationHash() {
    const paramStr = this.env.buildParamStr();
    window.location.hash = '#' + paramStr;
  }

  /**
   * Show custom alerts above query input.
   */
  showInfoAlerts() {
    const params = Env.getUrlParams();
    const alert = document.querySelector('#alert');
    if (params.status) {
      alert.removeAttribute('hidden');
    }
    switch (params.status) {
      case 'not_found':
        alert.innerHTML =
          'No matching shortcut found. Did you use a <a href="https://trovu.net/docs/">keyword</a>? Try <a target="_blank" href="/docs/users/troubleshooting/">Troubleshooting</a>. ';
        break;
      case 'not_reachable':
        alert.innerHTML = `This shortcut is not reachable. Add <span class="namespace">${params.namespace}</span> to your <a target="_blank" href="https://trovu.net/docs/shortcuts/namespaces/">namespaces</a>.`;
        break;
      case 'reloaded':
        alert.textContent = 'Shortcuts were reloaded in all namespaces.';
        if (this.env.github) {
          alert.textContent +=
            ' Changes on your GitHub might require a reload in 5 minutes due to caching.';
        }
        break;
      case 'deprecated':
        alert.innerHTML = `Your shortcut <strong><em>${params.query}</em></strong> is deprecated. Please use:`;
        break;
      case 'removed':
        alert.innerHTML = `The shortcut <a target="_blank" href="https://github.com/search?l=&q=${encodeURIComponent(
          params.key,
        )}+repo%3Atrovu%2Ftrovu-data&type=code">
          ${params.query}</a> was removed as does not adhere to our 
          <a target="_blank" href="/docs/editors/policy/">Content policy</a>. 
          But you can <a target="_blank" href="/docs/users/advanced/">
          create a user shortcut in your own namespace</a>.`;
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
    const processUrl = this.env.getProcessUrl({ query: this.queryInput.value });
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
    this.queryInput.value = 'reload';
    this.submitQuery();
  };

  /**
   * Add Opensearch tag.
   */
  addLinkSearch() {
    const params = new URLSearchParams(location.hash.substring(1));
    // Only keep relevant parameters.
    for (const [key] of params.entries()) {
      if (!['language', 'country', 'github'].includes(key)) {
        params.delete(key);
      }
    }
    const link = `<link
    rel="search"
    type="application/opensearchdescription+xml"
    href="/opensearch/?${params.toString()}"
    title="Trovu"
    />`;
    const head = document.querySelector('head');
    head.innerHTML += link;
  }
}
