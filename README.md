# Userscript for auto-filling and submitting forms

## For Users

### Requirements

- for Firefox: [Greasemonkey](https://addons.mozilla.org/firefox/addon/greasemonkey/) 
- for Chrome: [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)

### Install

1. In your browser, open https://www.findfind.it/profiles/serchilo_profile/userscripts/fill-and-submit.user.js
2. There should be a dialog opening that offers to install the user script. 
3. Install and you are done.

## For Developers

### Requirements

- [Node.js](https://nodejs.org/)
- [NPM](https://www.npmjs.com)

### Edit and install

- Only edit `fill-and-submit.user.src.js`
- `npm install`. This will download all necessary dependencies to `node_modules`.
- `npm run build` This will create `fill-and-submit.user.js`.
