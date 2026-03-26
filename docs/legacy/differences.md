# Differences to Serchilo and FindFind.it

[Trovu](https://trovu.net/) is the official successor of Serchilo / [FindFind.it](https://www.findfind.it/).

If you know FindFind.it, then you almost know how Trovu works. However, a few things are different:

-   **Main difference:** search queries are not sent out to the server, all processing is done in the client.
    -   This means much more privacy.
-   The placeholder syntax [changed](../shortcuts/url.md), from `{%query}` to `<query>`.
-   Country namespaces are not 3-letter but 2-letter-codes, prefixed with a dot. So they are much easier to remember, as they (mostly) follow top-level domains. For example:
    -   `.de` is the namespace for Germany (not `deu`),
    -   `.pl`is the namespace for Poland (not `pol`)
-   There are now also [namespaces](../shortcuts/namespaces.md) for dictionaries, making it easy for [advanced users](../users/advanced.md) set preferred dictionaries.
-   Trovu makes much more use of [typed arguments](../shortcuts/url.md), like `city` and `date`. So many Google Maps shortcuts like `gmb brandenburger tor` (for Berlin) could be replaced with a single `gm b,brandenburger tor` (where `b` can be any city abbreviation in Germany)
-   An [include](../shortcuts/include.md) functionality was added where shortcuts can share settings with other shortcuts, and where [advanced users](../users/advanced.md) can easily override keywords for themselves while style benefitting from the curated URL of a shorcut.
-   Instead in a server database, shortcuts are kept in [YAML files](../shortcuts/namespaces.md), in a [subdirectory](https://github.com/trovu/trovu/tree/master/data/). There, we can stand on Git's shoulders to keep track of shortcut additions and changes. Pull and merge requests are welcome.
-   Once you open Trovu, all shortcuts are loaded into your client and remain cached there, (until you [reload](../users/troubleshooting.md#i-edited-a-shortcut-but-it-has-no-effect)). So even if the Trovu server is down, you can keep using Trovu.
-   If you have personal **user shortcuts**, for Trovu you host them on [your GitHub account, or on your web server](../users/advanced.md).

Read more about how [migrate from FindFind.it to Trovu](migrate.md).
