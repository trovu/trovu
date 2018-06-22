# trovu – Web shortcuts, social, private.

trovu is a spin-off from [Serchilo](https://github.com/georgjaehnig/serchilo-drupal) / [FindFind.it](https://www.findfind.it/).

trovu allows you to define shortcuts for URLs / websites and then quickly access them in a command-line way, e.g.

- `g berlin` – search Google for "berlin".
- `gd london, liverpool` – find a route on Google Maps from London to Liverpool. 
- `db b, m` – find the next *Deutsche Bahn* train connection from Berlin to Munich.

## Differences to Serchilo

- The shortcuts are kept in text and YAML files in a public Git(hub) repository. Users can also use their own repository, thus:
  - **more freedom**.
- trovu's parsing works completely client-side, so no search queries are sent out, only to the actual target site. Thus:
  - **faster processing**,
  - **enhanced privacy**.

## Step-by-step: How a query is processed

![](https://github.com/trovu/trovu.github.io/blob/master/img/process.png)

First, lets look at the (example) settings:

- Namespace URL templates: For every namespace, the template defines where to look for its shortcuts. For site namespaces they point to the repository [trovu-data](https://github.com/trovu/trovu-data). Optionally, for user namespaces they can point anywhere.
  - o: `https://raw.githubusercontent.com/trovu/trovu-data/master/shortcuts/o/{%keyword}/{%argumentCount}.txt`
  - de: `https://raw.githubusercontent.com/trovu/trovu-data/master/shortcuts/de/{%keyword}/{%argumentCount}.txt`
  - .de: `https://raw.githubusercontent.com/trovu/trovu-data/master/shortcuts/.de/{%keyword}/{%argumentCount}.txt`
  - johndoe: `https://example.com/trovu/{%keyword}.{%argumentCount}.txt`

Now, lets look at a processing of a query"

1. A query comes in, e.g. `g foobar`.
1. The current namespace setting is `o,de,.de,johndoe`.
1. The query is parsed – in the client by Javascript – into
   - keyword: `g`
   - argument: `foobar`
1. Based on the query and the namespace settings, the client Javascript tries to fetch 4 URLs:
   - https://raw.githubusercontent.com/trovu/trovu/master/shortcuts/.de/g/1.txt
   - https://raw.githubusercontent.com/trovu/trovu/master/shortcuts/de/g/1.txt
   - https://raw.githubusercontent.com/trovu/trovu/master/shortcuts/o/g/1.txt
   - https://example.com/trovu/g.1.txt

1. From the fetches that succeeded, the results are evaluated in namespace order.
1. Since already the first text file exists, its URL is used for further processing
    -  `https://www.google.de/search?hl={$language}&q={%query}&ie=utf-8` 
1. The `{$language}` placeholder is being replaced with the variable `de`.
1. The `{%query}` placeholder is being replaced with the query argument `foobar`.
1. A redirect to the URL is made.

## Repositories

### [trovu-data](https://github.com/trovu/trovu-data)

This repository contains all the data, e.g.

- shortcuts
- mappings (later)

Fork this repository to add or edit shortcuts (and send then a pull request).

### [trovu-web](https://github.com/trovu/trovu-web)

This repository contains the web frontend.

### trovu-android / trovu-ios / trovu-gtk

Future plans. (Can be picked up by anyone.)

## Demo

https://trovu.net/
