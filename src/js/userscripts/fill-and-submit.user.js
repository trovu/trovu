// ==UserScript==
// @name         Trovu: Fill and Submit
// @namespace    http://tampermonkey.net/
// @version      0.6.1
// @description  Fills input fields with URL parameters and submits form.
// @downloadURL  https://trovu.net/userscripts/fill-and-submit.user.js
// @author       Ralf Anders, Georg Jaehnig
// @match        *://*/*
// @grant        none
// ==/UserScript==

// ==Changelog==
// v0.6.1 - 2024-07-14
// - Report error if fill param cannot be parsed.
// - Report error if element cannot be found.
//
// v0.6.0 - 2024-07-13
// - Added parameter 'waitBeforeFill' to delay filling (and submitting).
//
// ==/Changelog==

(function () {
  "use strict";

  const params = new URLSearchParams(decodeURIComponent(window.location.hash.substring(1)));
  const waitBeforeFill = params.get("trovu[waitBeforeFill]") || params.get("serchilo[waitBeforeFill]") || 0;

  setTimeout(function () {
    // Process 'fill' params and set values.
    // Also look for 'serchilo' params for backwards compatibility.
    for (const [key, value] of params) {
      if ((key.startsWith("trovu") || key.startsWith("serchilo")) && key.includes("[fill]")) {
        const matches = key.match(/\[fill\]\[(.*?)\]$/);
        if (!matches) {
          console.error(`Trovu fill-and-submit: Error parsing parameter "${key}" with value "${value}"`);
          continue;
        }
        const selector = key.match(/\[fill\]\[(.*?)\]$/)[1];
        const element = document.querySelector(selector);
        if (!element) {
          console.error(`Trovu fill-and-submit: Could not find element "${selector}"`);
          continue;
        }
        element.value = value;
      }
    }
    // Trigger 'submit' if specified.
    const submitSelector = params.get("trovu[submit]") || params.get("serchilo[submit]");
    if (submitSelector) {
      const submitElement = document.querySelector(submitSelector);
      if (!submitElement) {
        console.error(`Trovu fill-and-submit: Could not find submit element "${submitSelector}"`);
      } else {
        submitElement.click();
      }
    }
  }, waitBeforeFill);
})();
