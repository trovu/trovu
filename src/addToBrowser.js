/** @module AddToBrowser */


/** Set and manage the "Add to Browser" functionality. */

export default class AddToBrowser {
  /**
   * Add Opensearch tag.
   */
  static addLinkSearch() {
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
}
