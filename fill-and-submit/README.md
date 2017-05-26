# Userscript for auto-filling and submitting forms

## For Users

### Requirements

- for Firefox: [Greasemonkey](https://addons.mozilla.org/firefox/addon/greasemonkey/) 
- for Chrome: [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)

### Install

1. In your browser, open https://www.findfind.it/profiles/serchilo_profile/userscripts/fill-and-submit.user.js
2. There should be a dialog opening that offers to install the user script. 
3. Install and you are done.

## For Shortcut editors

### Creating shortcut that use the userscript

The shortcut URL should look like this (linebreaks only for clarity):

    https://patentscope.wipo.int/search/en/search.jsf#
      serchilo[fill][%23simpleSearchSearchForm\:fpSearch]={%query}&
      serchilo[submit]=%23simpleSearchSearchForm\:commandSimpleFPSearch

So to make use of the userscript, add a hash parameter (after a `#`), called `serchilo`. It must contain the properties `[fill]` and `[submit]`.

Given the example above, it:

1. calls the URL
2. fills input field found with CSS selector `#simpleSearchSearchForm:fpSearch` with value from `{%query}`
3. submits form with submit button selected by `#simpleSearchSearchForm:commandSimpleFPSearch`

### Documentation:

- `serchilo[fill]`: array containing selectors and values

    serchilo[fill][selector1] = value1
    serchilo[fill][selector2] = value2
    ...

- `serchilo[submit]`: string with selector of element to click on.

#### Notation: selector string must escape some chars:

-  `:` = `\:`
-  `.` = `\.`
-  `#` = `%23`
 

## For Developers

### Requirements

- [Node.js](https://nodejs.org/)
- [NPM](https://www.npmjs.com)

### Edit and install

- Only edit `fill-and-submit.user.src.js`
- `npm install`. This will download all necessary dependencies to `node_modules`.
- `npm run build` This will create `fill-and-submit.user.js`.
