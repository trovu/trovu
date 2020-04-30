## Debugging mode

Call Trovu with [`&debug=1`](https://trovu.net/#debug=1) to not get redirected but to see

- which config and shortcut URLs are being fetched
- whether they are found in the browser cache or not
- how a query got matched.

## I Edited a Shortcut, but It Has No Effect

This might be a caching issue.

First of all, make sure that GitHub has updated the raw version of the shortcut file you edited. Click on the “raw” button and keep refreshing the page until you see your changes.

Call the query prefixed with `reload:`, e.g. `reload:g foobar`. 

If that did not help, try debugging mode (see above).

And if that did not help, clear your browser cache. There are extensions that make this easy, such as [Clear Cache](https://addons.mozilla.org/de/firefox/addon/clearcache/) for Firefox or [Clear Cache](https://chrome.google.com/webstore/detail/clear-cache/cppjkneekbjaeellbfkmgnhonkkjfpdn) for Chrome.