# [trovu.net](https://trovu.net/) – Web shortcuts, social, private.

trovu is a spin-off from [Serchilo](https://github.com/georgjaehnig/serchilo-drupal) / [FindFind.it](https://www.findfind.it/). Read about the [[differences|Differences to Serchilo and FindFind.it]].

trovu allows you to define shortcuts for URLs / websites and then quickly access them in a command-line way, e.g.

- `g berlin` – search Google for "berlin".
- `w berlin` – Wikipedia article for "berlin" in your language.
- `gd london, liverpool` – find a route on Google Maps from London to Liverpool. 

## Key features

- **Privacy**: Queries are processed in the client, not server.
- **Social**: Curated shortcuts are kept in YAML files in a [public Github repository](https://github.com/trovu/trovu-data). Send a pull request to add or edit them.
- **Freedom**: Optionally, create personal shortcuts in [your own repository](https://github.com/trovu/trovu-data-user).

## Read more

- [[Namespaces]]
- [[How a query is processed]]
- [[Shortcut URLs]]
- [Advanced settings & personal shortcuts](https://github.com/trovu/trovu.github.io/wiki/Advanced-settings-&-personal-shortcuts)
- [[Trovu compared to Serchilo / FindFind.it|Differences to Serchilo and FindFind.it]]
- [[Migrate from FindFind.it]]
- **[[Troubleshooting / FAQ|Troubleshooting]]**
- [[Support]]

## Repositories

### [trovu-data](https://github.com/trovu/trovu-data)

This repository contains all the data, e.g.

- shortcuts
- types/city
  - mappings for [argument type *city*](https://github.com/trovu/trovu.github.io/wiki/Shortcut-URLs#city)

Fork this repository to add or edit shortcuts (and send then a pull request).

### [trovu-web](https://github.com/trovu/trovu-web)

This repository contains the web frontend.

## Live web version

https://trovu.net/
