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

/*
 * Works on URLs called with an array GET parameter 'serchilo'
 * containing the properties [fill] and [submit].
 *
 * Example (line break only for clarity):
 *
 *   https://patentscope.wipo.int/search/en/search.jsf#
 *     serchilo[fill][%23simpleSearchSearchForm\:fpSearch]=Liebherr&
 *     serchilo[submit]=%23simpleSearchSearchForm\:commandSimpleFPSearch
 *
 *   1. calls the URL
 *   2. fills input field found with CSS selector '#simpleSearchSearchForm:fpSearch'
 *      with value 'Liebherr'
 *   3. submits form with submit button selected by '#simpleSearchSearchForm:commandSimpleFPSearch'
 *
 * Documentation:
 *
 * serchilo[fill]: array containing selectors and values
 *
 *   serchilo[fill][selector1] = value1
 *   serchilo[fill][selector2] = value2
 *   ...
 *
 * serchilo[submit]: string with selector of element to click on.
 *
 * Notation: selector string must escape some chars:
 *
 *   : = \:
 *   . = \.
 *   # = %23
 *
*/

(function () {

  "use strict";

  var qs = require('qs');

  // Get queryString from URL, cut off '?'.
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

}());

