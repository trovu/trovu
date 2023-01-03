## General
### Reload

Config and shortcut files are usually only fetched once, and after that are only taken from the browser cache. So if you have made changes to one of them, you need to reload them.

You can reload by:

* prefixing your query with `reload:`, e.g. `reload:g foobar`
* sending a query only containing `reload`
* opening the Trovu homepage with https://trovu.net/?#reload=1.

### Debugging mode

Enter debugging mode with

- https://trovu.net/?#debug=1 , or
- a query starting with `debug:`, e.g.: `debug:g foobar`

In debug, all the processing will be done – but without the actual redirect. You will be able to see

- which config and shortcut URLs are being fetched
- whether they are found in the browser cache or not
- how a query got matched.

You can also combine debugging and reloading, e.g. `debug:reload:g foobar`

## FAQ
### I Edited a Shortcut, but It Has No Effect

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