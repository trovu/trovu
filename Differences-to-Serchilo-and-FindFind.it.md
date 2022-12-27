[Trovu](https://trovu.net/) is the official successor of Serchilo / [FindFind.it](https://www.findfind.it/). FindFind.it will be **closed latest in October 2023**, with the [end of life of Drupal 7](https://www.drupal.org/psa-2022-02-23).

If you know FindFind.it, then you almost know how Trovu works. However, a few things are different:

- **Main difference:** search queries are not sent out to the server, all processing is done in the client.
  - Thus, none of your search queries is sent to the Trovu server, which means much more privacy.
- Country namespaces are not 3-letter but 2-letter-codes, prefixed with a dot, e.g.
  - `.de`, not `deu`
  - `.pl`, not `pol`
- Instead in a server database, shortcuts are kept in [[YAML files|Home#trovu-data]], in a [separate Github repository](https://github.com/trovu/trovu-data/). There, we can stand on Git's shoulders to keep track of shortcut additions and changes. Merge requests are welcome.
- Once you open Trovu, all shortcuts are loaded into your client and remain cached there, (until you [reload](https://github.com/trovu/trovu.github.io/wiki/Troubleshooting#i-edited-a-shortcut-but-it-has-no-effect)). So even if the Trovu server is down, you can keep using Trovu.
- If you have personal **user shortcuts**, for Trovu you host them on [your Github account](https://github.com/trovu/trovu.github.io/wiki/Advanced-settings-&-personal-shortcuts).
  -  Potentially, this allows us to have **private/secret user shortcuts** in the future: Instead on Github, you could host on your own server, behind a password protection, e.g. `https://user:password@example.com/my_trovu/shortcuts.yml`. Not sure if there's a need, if so, [please open a ticket](https://github.com/trovu/trovu-web/issues).

Read more how to migrate [[migrate from FindFind.it to Trovu|Migrate from FindFind.it]].