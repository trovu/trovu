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

  var qs = require('qs');

  // Get queryString from URL, cut off '#'.
  var queryString = window.location.hash.substring(1);

  if (!queryString) return;

  var queryStringObject = qs.parse(queryString);

  var params = queryStringObject.serchilo || queryStringObject.trovu || false;

  if (typeof params != 'object') return;

  // Check if serchilo[fill] and serchilo[submit] is set.
  if (!'fill' in params) return;
  if (!'submit' in params) return;

  // Iterate over serchilo[fill] keys
  // and fill the fields with values.
  for (var selector in params.fill) {
    var element = document.querySelector(selector);
    if (!element) continue;
    if (!'value' in element) continue;
    element.value = params.fill[selector];
  }

  // Find submit element.
  element = document.querySelector(params.submit);
  if (!element) return;
  if (!'click' in element) return;

  element.click();
})();
