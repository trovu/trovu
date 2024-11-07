# Userscripts

## fill-and-submit

Userscript for autofilling and submitting forms on target websites. This may help when queries cannot be passed by URL. Then one can define inputs by their CSS selectors that shall be filled with URL-passed arguments once the destination website is loaded, and a form button that shall be clicked automatically by JavaScript.

### For users

#### Requirements

-   for Firefox: [Tampermonkey](https://addons.mozilla.org/firefox/addon/tampermonkey/)
-   for Chrome: [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
    -   Note that there is now a [requirement to enable Developer Mode](https://www.tampermonkey.net/faq.php?locale=en#Q209) in Chrome.

#### Install

1. In your browser, open [https://trovu.net/userscripts/fill-and-submit.user.js](https://trovu.net/userscripts/fill-and-submit.user.js)
2. If you have installed the requirements before there should be now a dialog opening offering to install the user script.
3. Install and you are done.

### For shortcut editors

#### Creating a shortcut that use the userscript

The [shortcut URL](url.md) should look like this (line breaks only for clarity):

    https://patentscope.wipo.int/search/en/search.jsf#
      trovu[fill][%23simpleSearchForm\:fpSearch\:input]=<query>&
      trovu[submit]=%5Bid%5E%3D%22simpleSearchForm%3AfpSearch%3Aj%22%5D

So to make use of the userscript, add a hash parameter (after a `#`), called `trovu`. It must contain the properties `[fill]` and `[submit]`.

Given the example above, it:

1. calls the URL
2. fills input field found with CSS selector `#simpleSearchForm:fpSearch:input` with value from `<query>`
3. submits form with submit button selected by `[id^="simpleSearchForm:fpSearch:j"]`

#### Documentation:

-   `trovu[fill]`: array containing selectors and values

    -   `trovu[fill][selector1]=value1`
    -   `trovu[fill][selector2]=value2`
    -   `...`

-   `trovu[submit]`: string with selector of element to click on.

##### Notation: selector string must escape some chars:

-   `:` = `\:`
-   `.` = `\.`
-   `#` = `%23`

### For developers

#### Edit and install

-   Edit `src/js/userscripts/fill-and-submit.user.js`
-   `npm run deploy` will also deploy `fill-and-submit.user.js`.
