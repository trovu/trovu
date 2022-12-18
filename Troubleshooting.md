## Debugging mode

Call Trovu with [`&debug=1`](https://trovu.net/#debug=1) to not get redirected but to see

- which config and shortcut URLs are being fetched
- whether they are found in the browser cache or not
- how a query got matched.

## I Edited a Shortcut, but It Has No Effect

This might be a caching issue.

First of all, make sure that `data.trovu.net` has updated the raw version of the shortcut file you edited. For example, 

- `o`-namespace (planet) shortcuts are at https://data.trovu.net/data/shortcuts/o.yml.
- `de`-namespace (German language) shortcuts are at https://data.trovu.net/data/shortcuts/de.yml.
- `.de`-namespace (Germany) shortcuts are at https://data.trovu.net/data/shortcuts/.de.yml.

Then, you can either

- call a query containing only `reload`.
- call your query prefixed with `reload:`, e.g. `reload:g foobar`.

Both will cause your browser to reload the shortcut files from `data.trovu.net`.

If that did not help, try debugging mode (see above).

And if that did not help, clear your browser cache. There are extensions that make this easy, such as [Clear Cache](https://addons.mozilla.org/de/firefox/addon/clearcache/) for Firefox or [Clear Cache](https://chrome.google.com/webstore/detail/clear-cache/cppjkneekbjaeellbfkmgnhonkkjfpdn) for Chrome.