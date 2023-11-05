// ==UserScript==
// @name         Trovu: Fill and Submit
// @namespace    http://tampermonkey.net/
// @version      0.5.1
// @description  Fills input fields with URL parameters and submits form.
// @downloadURL  https://trovu.net/userscripts/fill-and-submit.user.js
// @author       Ralf Anders, Georg Jaehnig
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const params = new URLSearchParams(
    decodeURIComponent(window.location.hash.substring(1)),
  );

  // Process 'fill' params and set values.
  // Also look for 'serchilo' params for backwards compatibility.
  for (const [key, value] of params) {
    if (
      (key.startsWith('trovu') || key.startsWith('serchilo')) &&
      key.includes('[fill]')
    ) {
      const selector = key.match(/\[fill\]\[(.*?)\]$/)[1];
      const element = document.querySelector(selector);
      if (element) element.value = value;
    }
  }
  // Trigger 'submit' if specified.
  const submitSelector =
    params.get('trovu[submit]') || params.get('serchilo[submit]');
  if (submitSelector) {
    const submitElement = document.querySelector(submitSelector);
    if (submitElement) submitElement.click();
  }
})();
