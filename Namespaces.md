Every shortcut belongs to exactly one namespace. Namespaces allow the same keyword to be used for different shortcuts – according to the user's language, location or personal setup. For instance, while all other users use the keyword `g` for Google, you might use it for something else – with your user namespace.

## Namespace types

Namespace type | Example namespaces | Naming convention | Contains | Example shortcuts
--- | --- | --- | --- | ---
language | [de](https://github.com/trovu/trovu-data/tree/master/shortcuts/de), [en](https://github.com/trovu/trovu-data/tree/master/shortcuts/en) | 2 chars, by [ISO 639-1](http://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) | shortcuts related to a particular language | [English-German dictionary](https://github.com/trovu/trovu-data/blob/master/shortcuts/de/en/1.yml)
country | [.de](https://github.com/trovu/trovu-data/tree/master/shortcuts/.de), [.us](https://github.com/trovu/trovu-data/tree/master/shortcuts/.us) | dot and 2 chars, by [ISO 3166-1 alpha2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) | shortcuts related to a particular country | [Deutsche Bahn Fahrplanauskunft](https://github.com/trovu/trovu-data/tree/master/shortcuts/.de/db)
user | [georgjaehnig](https://github.com/georgjaehnig/trovu-data/tree/master/shortcuts/)| a github user name (can be overridden with a custom name) | custom shortcuts created by a user in their repo | [Trains from my home station](https://github.com/georgjaehnig/trovu-data-user/blob/master/shortcuts/br.1.yml)
planet | [o](https://github.com/trovu/trovu-data/tree/master/shortcuts/o)| the shape of the planet |         shortcuts unrelated to a language or country | [Google web search](https://github.com/trovu/trovu-data/blob/master/shortcuts/o/g/1.yml)

`language` and `country` are `site` namespaces. They are curated and 
[here to find](https://github.com/trovu/trovu-data/tree/master/shortcuts). (Pull requests are welcome.)

## Uniqueness in a namespace

In a namespace, there can be only one shortcut with the same keyword and the same number of arguments: So in [o](https://github.com/trovu/trovu-data/tree/master/shortcuts/o), there is only one shortcut `g` with one argument, the [Google web search](https://github.com/trovu/trovu-data/blob/master/shortcuts/o/g/1.yml).

## Using namespaces

### Basic

The namespaces you use are derived from your settings (settings wheel left of the input field). For instance, having set

- language: English
- country: Unites States

your namespaces will be:

- `o` (`planet` namespace)
- `en` (English language)
- `.us` (USA)

### Advanced (with your Github account)

Your namespaces are [derived from your config.yml](https://github.com/trovu/trovu.github.io/wiki/Advanced-settings-&-personal-shortcuts).

## Priority of namespaces

The latter, the higher: So in the example before, shortcuts from `.us` override those from `en`, and both those from `o`.

## Forcing a namespace

You can force to use a certain namespace by prefixing the query with "[namespace]."

- example namespace setting:
  - `o`
  - `de`
  - `fr`
  - `.us`
- example query: `de.en tree`
- result: Instead of the French-English dictionary (from `fr`), the shortcut for the German-English dictionary (from `de`) is called.
- explanation: Although `fr` has a higher priority than `de`, prefixing the query with `de.` forced to use the shortcut from `de`.

The forced namespace can be any namespace, even a site namespace you did not set up in your configuration.

## Default language and country

Calling the homepage URL without any namespaces will set the default language and country based on [navigator.language](https://developer.mozilla.org/en-US/docs/Web/API/NavigatorLanguage/language).