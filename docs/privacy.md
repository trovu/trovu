# Privacy Policy

Trovu does not log your personal information.

In particular:

-   We do not record IP addresses.
-   We do not record search queries.
-   We do not serve cookies.

Your search queries are not even sent to the Trovu server;
the entire processing happens in your browser.

## How a Query is Processed

Every query is attempted to be matched with a shortcut.
Shortcuts are organized by [Namespaces](../shortcuts/namespaces.md):
Each shortcut belongs exactly to one namespace.

### Namespace Setting

When calling Trovu without query parameters, three default namespaces will be set based on the browser's language settings.
For instance, if the browser's language is `de-DE`, these namespaces and their shortcut files will be used:

-   [o.yml](https://github.com/trovu/trovu/tree/master/data/shortcuts/o.yml) – planet namespace
-   [de.yml](https://github.com/trovu/trovu/tree/master/data/shortcuts/de.yml) – German language namespace
-   [.de.yml](https://github.com/trovu/trovu/tree/master/data/shortcuts/.de.yml) – Germany namespace

### Processing a Query

Let's look at the processing of a query:

1. A query comes in, e.g., `g foobar`.
2. The current namespace setting is `o,de,.de`.
3. Given the namespaces, all the shortcuts are fetched from their YAML files into a JavaScript variable in the client.
    - The fetch() call also checks if the files are already in the browser cache, and only requests them from remote if they are not cached yet.
    - To reload the shortcuts, use the `reload` command (see below).
4. The query is parsed – in the client by JavaScript – into
    - keyword: `g`
    - argument: `foobar`
5. Based on the query and the namespace settings, the loaded shortcuts are searched whether they match a query with the keyword `g` and one argument, i.e., if they contain a shortcut keyed with `g 1`.
6. We find two matches:
    - one in [o](https://github.com/trovu/trovu/tree/master/data/shortcuts/o.yml), pointing to `google.com`
    - and one in [.de](https://github.com/trovu/trovu/tree/master/data/shortcuts/.de.yml), pointing to `google.de`
7. From the found matches, the results are evaluated in namespace order.
8. Since namespace `.de` has higher priority than `o`, its URL is used for further processing
    - `https://www.google.de/search?hl=<$language>&q=<query>&ie=utf-8`
9. The `<$language>` placeholder is replaced with the variable `de`.
10. The `<query>` placeholder is replaced with the query argument `foobar`.
11. A redirect to the URL is made.

### Reloading Shortcuts

Since shortcuts are cached in the browser cache, you may want to reload them once they are updated.
Do so by

-   either prefixing a query: `reload:g foobar`
-   or only calling `reload`.
