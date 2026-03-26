# Namespaces

Shortcuts are stored in [YAML](https://en.wikipedia.org/wiki/YAML) files, organized by namespaces. They are part of the [/data](https://github.com/trovu/trovu/tree/master/data) subdirectory.

Every shortcut belongs to exactly one namespace. Namespaces allow the same keyword to be used for different shortcuts – according to the user's language, location or personal setup. This comes in handy e.g. for multi-country websites like Amazon:

-   `a shakespeare` shall search Amazon for books from Shakespeare – but Amazon from which country?

Thanks to namespaces, we can have the keyword `a` both

-   in the US country namespace `.us`,
-   as also in the Germany namespace `.de`

Depending on the country in your settings and thus the namespaces you use, the correct shortcut for Amazon will be picked.

But even more: You can also override shortcuts: For instance, while all other users use the keyword `g` for Google, you might use it for something else – with your user namespace.

Namespaces work well together with [Includes](include.md), especially for dictionaries.

## Namespace types

| Namespace type | Example namespaces                                                                                                                                                      | Naming convention                                                                         | Contains                                         | Example shortcuts                                                                                                                        |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| language       | [de](https://github.com/trovu/trovu/tree/master/data/shortcuts/de.yml), [en](https://github.com/trovu/trovu/tree/master/data/shortcuts/en.yml)                          | 2 chars, by [ISO 639-1](http://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)             | shortcuts related to a particular language       | Merriam-Webster dictionary: `en.mw tree` (from [en](https://github.com/trovu/trovu/tree/master/data/shortcuts/en.yml))                   |
| country        | [.de](https://github.com/trovu/trovu/tree/master/data/shortcuts/.de.yml), [.us](https://github.com/trovu/trovu/tree/master/data/shortcuts/.us.yml)                      | dot and 2 chars, by [ISO 3166-1 alpha2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) | shortcuts related to a particular country        | Deutsche Bahn Fahrplanauskunft: `.de.db berlin, hamburg` (from [.de](https://github.com/trovu/trovu/tree/master/data/shortcuts/.de.yml)) |
| dictionary     | [dcm](https://github.com/trovu/trovu/tree/master/data/shortcuts/dcm.yml) (dict.com), [lge](https://github.com/trovu/trovu/tree/master/data/shortcuts/lge.yml) (Linguee) | 3 chars, by their abbreviated name                                                        | shortcuts from a dictionary website              | German-English: `dcm.de-en tree`, `dcm.en-de tree`, `dcm.en-<$language> tree` (using `language` variable from settings)                  |
| user           | [georgjaehnig](https://github.com/georgjaehnig/trovu-data-user/blob/master/shortcuts.yml)                                                                               | a GitHub username (can be overridden with a custom name)                                  | custom shortcuts created by a user in their repo | Trains from my home station: `db> hamburg`                                                                                               |
| planet         | [o](https://github.com/trovu/trovu/tree/master/data/shortcuts/o.yml)                                                                                                    | the shape of the planet                                                                   | shortcuts unrelated to a language or country     | Google web search: `g berlin`                                                                                                            |

`language`, `country`, `dictionary` and `o (planet)` are **site namespaces**. They are curated and
[here to find](https://github.com/trovu/trovu/tree/master/data/shortcuts). (Pull requests are welcome.)

### Dictionary namespaces

Currently, the following dictionary namespaces are defined:

| Namespace | Dictionary                                                  |
| --------- | ----------------------------------------------------------- |
| `alm`     | [Online Latein Wörterbuch](https://albertmartin.de/latein/) |
| `ard`     | [arabdict](https://www.arabdict.com/)                       |
| `bab`     | [bab.la](https://bab.la/)                                   |
| `beo`     | [BEOLINGUS](https://dict.tu-chemnitz.de/)                   |
| `crd`     | [croDict](https://crodict.com/)                             |
| `dcc`     | [dict.cc](https://dict.cc/)                                 |
| `dcm`     | [Dictionary.com](https://www.dictionary.com/)               |
| `deo`     | [Dans-Esperanto ordbog](https://www.vortaro.dk/)            |
| `dtn`     | [Deutsch-Tuerkisch.net](https://deutsch-tuerkisch.net/)     |
| `esd`     | [SpanishDictionary.com](https://www.spanishdict.com/)       |
| `flx`     | [Folkets lexikon](https://folkets-lexikon.csc.kth.se/)      |
| `hzn`     | [Heinzelnisse](https://www.heinzelnisse.info/)              |
| `irs`     | [Irishionary.com](https://www.irishionary.com/)             |
| `leo`     | [leo.org](https://www.leo.org/)                             |
| `lge`     | [Linguee](https://www.linguee.com/)                         |
| `lgs`     | [Langenscheidt](https://www.langenscheidt.com/)             |
| `mdb`     | [MDBG Chinese Dictionary](https://www.mdbg.net/)            |
| `pka`     | [pauker.at](https://www.pauker.at/)                         |
| `pns`     | [PONS dictionary](https://pons.com/)                        |
| `rvs`     | [Reverso](https://www.reverso.net/)                         |
| `umt`     | [uitmuntend](https://www.uitmuntend.de/)                    |
| `wdk`     | [Wadoku](https://www.wadoku.de/)                            |
| `zrg`     | [Zargan](https://www.zargan.com/)                           |

## Uniqueness in a namespace

In a namespace, there can be only one shortcut with the same keyword and the same number of arguments: So in [o](https://github.com/trovu/trovu/tree/master/data/shortcuts/o), there is only one shortcut `g` with one argument, the [Google web search](https://github.com/search?q=repo%3Atrovu%2Ftrovu+path%3A**%2Fo.yml+%2F%5Eg+1%2F&type=code).

## Using namespaces

### Basic

The namespaces you use are derived from your settings (language code and flag next to the burger menu). For instance, having set

-   language: English
-   country: Unites States

your namespaces will be:

-   `o` (`planet` namespace)
-   `en` (English language)
-   `.us` (USA)

### Advanced (with your GitHub account)

Your namespaces are [derived from your config.yml](../users/advanced.md). With your personal configuration, you can use more than 3 namespaces. This can be useful when you like to use shortcuts from multiple languages and countries, e.g. dictionaries or public transport while travelling.

## Priority of namespaces

The lower a namespace is in the `namespaces` list, the higher it's precedence. This is similar to [Object-oriented programming](https://en.wikipedia.org/wiki/Object-oriented_programming), when a method needs to be picked from inheriting classes.

So in the example before, shortcuts from `.us` override those from `en`, and both those from `o`. Overriden shortcuts become _not reachable_.

## Per-call namespace, also overrides `language` or `country`

Let's say you have configured `language=en` but this time, you want to search the German Wikipedia. In this case, call

```
de.w berlin
```

So for a single call, you can prefix your query with `NAMESPACE.`. This namespace will then have the highest priority.

If that prefixed namespace happens to be a language or country namespace, it will also override the current language or country.

### Example in detail

#### Settings

Let's assume we use Trovu with these [settings](https://github.com/trovu/trovu-data-user/blob/master/config.yml):

```yaml
language: en
country: us
namespaces:
    - o
    - en
    - .us
```

#### Query

Now we call this query:

    de.w berlin

Here, we add the namespace [de](https://github.com/trovu/trovu/tree/master/data/shortcuts/de.yml). This means that for this very query

-   the [de](https://github.com/trovu/trovu/tree/master/data/shortcuts/de.yml) namespace is added to the `namespaces` list, with the highest priority.
-   Also, since `de` is a language, the language setting is changed to `de`.

So this query is now processed as if the settings were:

```yaml
language: de
country: us
namespaces:
    - o
    - en
    - .us
    - de
```

#### Result

Instead of the English Wikipedia (that would have been used with `language: en`), the German Wikipedia is used, because `language` is now set to `de`, and the Wikipedia shortcut's URL is defined as `url: https://<$language>.wikipedia.org/...`.

Had another shortcut `w 1` existed in namespace [de](https://github.com/trovu/trovu/tree/master/data/shortcuts/de.yml), then this shortcut would have been called, because we had added these namespaces to the subscribed namespaces, with the highest priority.

## Default language and country

Calling the homepage URL without any namespaces will set the default language and country based on [navigator.language](https://developer.mozilla.org/en-US/docs/Web/API/NavigatorLanguage/language).
