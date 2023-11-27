# Differences to Serchilo and FindFind.it

[Trovu](https://trovu.net/) is the official successor of Serchilo / [FindFind.it](https://www.findfind.it/).

If you know FindFind.it, then you almost know how Trovu works. However, a few things are different:

-   **Main difference:** search queries are not sent out to the server, all processing is done in the client.
    -   This means much more privacy.
-   Country namespaces are not 3-letter but 2-letter-codes, prefixed with a dot, e.g.
    -   `.de`, not `deu`
    -   `.pl`, not `pol`
-   Instead in a server database, shortcuts are kept in [YAML files](../shortcuts/namespaces.md), in a [subdirectory](https://github.com/trovu/trovu/tree/master/data/). There, we can stand on Git's shoulders to keep track of shortcut additions and changes. Pull and merge requests are welcome.
-   Once you open Trovu, all shortcuts are loaded into your client and remain cached there, (until you [reload](../users/troubleshooting.md#i-edited-a-shortcut-but-it-has-no-effect)). So even if the Trovu server is down, you can keep using Trovu.
-   If you have personal **user shortcuts**, for Trovu you host them on [your Github account](../users/advanced.md).
    -   Potentially, this allows us to have **private/secret user shortcuts** in the future: Instead on Github, you could host on your own server, behind password protection, e.g. `https://user:password@example.com/my_trovu/shortcuts.yml`. Not sure if there's a need, if so, [please open a ticket](https://github.com/trovu/trovu-web/issues).

Read more about how [migrate from FindFind.it to Trovu](migrate.md).
