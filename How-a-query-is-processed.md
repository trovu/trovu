
![](https://github.com/trovu/trovu.github.io/blob/master/img/process.basic.png)

First, lets look at the (example) settings:

- [[Namespaces]]: Site namespaces point to the repository [trovu-data](https://github.com/trovu/trovu-data). 
  - o: `https://raw.githubusercontent.com/trovu/trovu-data/master/shortcuts/o/{%keyword}/{%argumentCount}.yml`
  - de: `https://raw.githubusercontent.com/trovu/trovu-data/master/shortcuts/de/{%keyword}/{%argumentCount}.yml`
  - .de: `https://raw.githubusercontent.com/trovu/trovu-data/master/shortcuts/.de/{%keyword}/{%argumentCount}.yml`

(Optionally, user namespaces can point to forks of [trovu-data-user](https://github.com/trovu/trovu-data-user)).

Now, lets look at a processing of a query:

1. A query comes in, e.g. `g foobar`.
1. The current namespace setting is `o,de,.de`.
1. The query is parsed – in the client by Javascript – into
   - keyword: `g`
   - argument: `foobar`
1. Based on the query and the namespace settings, the client Javascript tries to fetch 3 URLs:
   - `https://raw.githubusercontent.com/trovu/trovu/master/shortcuts/.de/g/1.yml`
   - `https://raw.githubusercontent.com/trovu/trovu/master/shortcuts/de/g/1.yml`
   - `https://raw.githubusercontent.com/trovu/trovu/master/shortcuts/o/g/1.yml`

1. From the fetches that succeeded, the results are evaluated in namespace order.
1. Since already the first text file exists, its URL is used for further processing
    -  `https://www.google.de/search?hl={$language}&q={%query}&ie=utf-8` 
1. The `{$language}` placeholder is being replaced with the variable `de`.
1. The `{%query}` placeholder is being replaced with the query argument `foobar`.
1. A redirect to the URL is made.
