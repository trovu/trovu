// ==UserScript==
// @name         Trovu: Fill and Submit
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Fills input fields  with URL parameters and submits form.
// @downloadURL
// @author       Ralf Anders, Georg Jaehnig
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const qs = require('qs');

  // Get queryString from URL, cut off '#'.
  const queryString = window.location.hash.substring(1);

  if (!queryString) return;

  const queryStringObject = qs.parse(queryString);

  const params = queryStringObject.serchilo || queryStringObject.trovu || false;

  if (typeof params != 'object') return;

  // Check if serchilo[fill] and serchilo[submit] is set.
  if (!'fill' in params) return;
  if (!'submit' in params) return;

  // Iterate over serchilo[fill] keys
  // and fill the fields with values.
  for (const selector in params.fill) {
    const fillElement = document.querySelector(selector);
    if (!fillElement || !('value' in fillElement)) continue;
    fillElement.value = params.fill[selector];
  }

  // Find submit element.
  const submitElement = document.querySelector(params.submit);
  if (!submitElement) return;
  if (!'click' in submitElement) return;

  submitElement.click();
})();
