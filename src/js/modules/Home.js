/** @module Home */

import '../../scss/style.scss';
import 'bootstrap/dist/css/bootstrap.css';
import BSN from 'bootstrap.native/dist/bootstrap-native.esm.min.js';
import Env from './Env.js';
import Helper from './Helper.js';
import Settings from './home/Settings.js';
import Suggestions from './Suggestions';

/** Set and manage the homepage. */

export default class Home {
  constructor() {}

  async initialize() {
    Helper.logVersion();

    // Must be done before env.populate()
    // otherwise Chrome does not autodiscover.
    this.addLinkSearch();

    this.env = new Env();

    // Must be done before env.populate()
    // otherwise Chrome does not autodiscover.

    // Init environment.
    await this.env.populate();

    new Settings(this.env);

    this.showInfoAlerts();
    this.setLocationHash();
    this.setQueryElement();

    document.getElementById('query-form').onsubmit = this.submitQuery;
    document.documentElement.setAttribute('data-page-loaded', 'true');
  }

  /**
   * Get the URL to the Process script.
   */
  getProcessUrl() {
    const params = this.env.getParams();
    params['query'] = document.getElementById('query').value;

    const paramStr = Helper.getUrlParamStr(params);

    // "?" causes Chrome to translate plus signs properly into %2B
    // even when called from address bar.
    const processUrl = 'process/index.html?#' + paramStr;

    return processUrl;
  }

  setQueryElement() {
    switch (this.env.status) {
      case 'deprecated':
        document.querySelector('#query').value = this.env.alternative;
        break;
      case 'reloaded':
        document.querySelector('#query').value = '';
        break;
      default:
        document.querySelector('#query').value = this.env.query || '';
        break;
    }

    new Suggestions(this.env.namespaceInfos, this.submitQuery);
    document.querySelector('#query').focus();
  }

  setLocationHash() {
    const paramStr = this.env.getParamStr();
    window.location.hash = '#' + paramStr;
  }

  /**
   * Show custom alerts above query input.
   */
  showInfoAlerts() {
    const params = Helper.getUrlParams();

    // Show info alerts.
    switch (params.status) {
      case 'not_found':
        document.querySelector('#alert').removeAttribute('hidden');
        document.querySelector('#alert').innerHTML =
          'Could not find a matching shortcut for this query. Try <a target="_blank" href="https://github.com/trovu/trovu.github.io/wiki/Troubleshooting">Troubleshooting</a>.';
        break;
      case 'reloaded':
        document.querySelector('#alert').removeAttribute('hidden');
        document.querySelector('#alert').textContent =
          'Shortcuts were reloaded in all namespaces.';
        break;
      case 'deprecated':
        document.querySelector('#alert').removeAttribute('hidden');
        document.querySelector(
          '#alert',
        ).innerHTML = `Your shortcut <strong><em>${params.query}</em></strong> is deprecated. Please use:`;
        break;
      case 'removed':
        document.querySelector('#alert').removeAttribute('hidden');
        document.querySelector(
          '#alert',
        ).innerHTML = `The shortcut <a target="_blank" href="https://github.com/search?l=&q=${encodeURIComponent(
          params.key,
        )}+repo%3Atrovu%2Ftrovu-data&type=code">
          ${params.query}</a> was removed as does not adhere to our 
          <a target="_blank" href="https://github.com/trovu/trovu.github.io/wiki/Content-policy">Content policy</a>. 
          But you can <a target="_blank" href="https://github.com/trovu/trovu.github.io/wiki/Advanced-settings-&-personal-shortcuts">
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

    const processUrl = this.getProcessUrl();

    // Redirect to process script.
    window.location.href = processUrl;
  };

  /**
   * Add Opensearch tag.
   */
  addLinkSearch() {
    const paramStr = location.hash.substring(1);
    const xml = `<link
    rel="search"
    type="application/opensearchdescription+xml"
    href="/opensearch/?${paramStr}"
    title="Trovu"
    />`;
    const head = document.querySelector('head');
    head.innerHTML += xml;
  }
}
