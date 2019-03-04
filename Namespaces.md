Every shortcut belongs to exactly one namespace. Namespaces allow the same keyword to be used for different shortcuts – according to the user's language, location or personal setup. For instance, while all other users use the keyword `g` for Google, you might use it for something else – with your user namespace.

## Namespace types

Namespace type | Example namespaces | Naming convention | Contains | Example shortcuts
--- | --- | --- | --- | ---
language | [de](https://github.com/trovu/trovu-data/tree/master/shortcuts/de), [en](https://github.com/trovu/trovu-data/tree/master/shortcuts/en) | 2 chars, by [ISO 639-1](http://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) | shortcuts related to a particular language | [English-German dictionary](https://github.com/trovu/trovu-data/blob/master/shortcuts/de/en/1.yml)
country | [.de](https://github.com/trovu/trovu-data/tree/master/shortcuts/.de), [.us](https://github.com/trovu/trovu-data/tree/master/shortcuts/.us) | dot and 2 chars, by [ISO 3166-1 alpha2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) | shortcuts related to a particular country | [Deutsche Bahn Fahrplanauskunft](https://github.com/trovu/trovu-data/tree/master/shortcuts/.de/db)
user | [georgjaehnig](https://github.com/georgjaehnig/trovu-data/tree/master/shortcuts/)| a github user name (can be overridden with a custom name) | custom shortcuts created by a user in their repo | [Trains from my home station](https://github.com/georgjaehnig/trovu-data-user/blob/master/shortcuts/br.1.yml)
planet | [o](https://github.com/trovu/trovu-data/tree/master/shortcuts/o)| the shape of the planet |         shortcuts unrelated to a language or country | [Google web search](https://github.com/trovu/trovu-data/blob/master/shortcuts/o/g/1.yml)

[These directories](https://github.com/trovu/trovu-data/tree/master/shortcuts) are all the (curated) site namespaces.

## Uniqueness in a namespace

In a namespace, there can be only one shortcut with the same keyword and the same number of arguments: So in [o](https://github.com/trovu/trovu-data/tree/master/shortcuts/o), there is only one shortcut `g` with one argument, the [Google web search](https://github.com/trovu/trovu-data/blob/master/shortcuts/o/g/1.yml).

## Using namespaces

### Basic

The namespaces you use are derived from your settings (settings wheel left of the input field). For instance, having set

- language: English
- country: Unites States

your namepspaces will be:

- `o` (planet namespaces)
- `en` (English language)
- `.us` (USA)

