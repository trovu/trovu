// ==UserScript==
// @name         FindFind.it / Serchilo: Fill and Submit 
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Fills input fields  with URL parameters and submits form.
// @downloadURL
// @author       Ralf Anders, Georg Jaehnig
// @match        *://*/*
// @exclude      *://*.google.*/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  var qs = require('qs');

  // Get queryString from URL, cut off '#'.
  var queryString = window.location.hash.substr(1);

  if (!queryString) return;

  var queryStringObject = qs.parse(queryString);

  // Check if parameter 'serchilo' is set.
  if (!'serchilo' in queryStringObject) return;

  var serchilo = queryStringObject.serchilo;
  if (typeof serchilo != 'object') return;

  // Check if serchilo[fill] and serchilo[submit] is set.
  if (!'fill' in serchilo) return;
  if (!'submit' in serchilo) return;

  // Iterate over serchilo[fill] keys
  // and fill the fields with values.
  for (var selector in serchilo.fill) {
    var element = document.querySelector(selector);
    if (!element) continue;
    if (!'value' in element) continue;
    element.value = serchilo.fill[selector];
  }

  // Find submit element.
  element = document.querySelector(serchilo.submit);
  if (!element) return;
  if (!'click' in element) return;

  element.click();
})();
