Every shortcut belongs to exactly one namespace. Namespaces allow the same keyword to be used for different shortcuts – according to the user's language, location or personal setup. This comes in handy e.g. for multi-country websites like Amazon:

- `a shakespeare` shall search Amazon for books from Shakespeare – but Amazon from which country?

Thanks to namespaces, we can have the keyword `a` both

- in the US country namespace `.us`,
- as also in the Germany namespace `.de`

Depending on the country in your settings and thus the namespaces you use, the correct shortcut for Amazon will be picked.

But even more: You can also override shortcuts: For instance, while all other users use the keyword `g` for Google, you might use it for something else – with your user namespace.

Namespaces work well together with [[Includes]], especially for dictionaries.

## Namespace types

Namespace type | Example namespaces | Naming convention | Contains | Example shortcuts
--- | --- | --- | --- | ---
language | [de](https://github.com/trovu/trovu-data/tree/master/shortcuts/de.yml), [en](https://github.com/trovu/trovu-data/tree/master/shortcuts/en.yml) | 2 chars, by [ISO 639-1](http://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) | shortcuts related to a particular language | Merriam-Webster dictionary: `mw tree` (from [en](https://github.com/trovu/trovu-data/blob/master/shortcuts/en.yml))
country | [.de](https://github.com/trovu/trovu-data/tree/master/shortcuts/.de.yml), [.us](https://github.com/trovu/trovu-data/tree/master/shortcuts/.us.yml) | dot and 2 chars, by [ISO 3166-1 alpha2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) | shortcuts related to a particular country | Deutsche Bahn Fahrplanauskunft: `db berlin, hamburg` (from [.de](https://github.com/trovu/trovu-data/blob/master/shortcuts/.de.yml))
dictionary | [dcm](https://github.com/trovu/trovu-data/tree/master/shortcuts/dcm.yml) (dict.com), [lge](https://github.com/trovu/trovu-data/tree/master/shortcuts/lge.yml) (Linguee) | 3 chars, by their abbreviated name | shortcuts from a dictionary website | German-English: `de-en tree`, `en-de tree`, `en-{$language} tree` (using `language` variable from settings)
user | [georgjaehnig](https://github.com/georgjaehnig/trovu-data/tree/master/shortcuts/)| a Github user name (can be overridden with a custom name) | custom shortcuts created by a user in their repo | Trains from my home station: `db> hamburg`
planet | [o](https://github.com/trovu/trovu-data/tree/master/shortcuts/o.yml)| the shape of the planet |         shortcuts unrelated to a language or country | Google web search: `g berlin`

`language`, `country`, `dictionary`  and `o (planet)` are __site namespaces__. They are curated and 
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

Your namespaces are [derived from your config.yml](https://github.com/trovu/trovu.github.io/wiki/Advanced-settings-&-personal-shortcuts). With your personal configuration, you can use more than 3 namespaces. This can be useful when you like to use shortcuts from multiple languages and countries, e.g. dictionaries or public transport while travelling. 

## Priority of namespaces

The latter, the higher: So in the example before, shortcuts from `.us` override those from `en`, and both those from `o`.

## Forcing a namespace (and overriding `language` or `country` setting)

You can force to use a certain namespace by prefixing the query with `[namespace].` If `[namespace]` happens to be a language or country namespace, it will also override the current language or country. 

### Example
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

    de.en tree

Here, we force the namespace [de](https://github.com/trovu/trovu-data/blob/master/shortcuts/de.yml). This means that for this very query

- the [de](https://github.com/trovu/trovu-data/blob/master/shortcuts/de.yml) namespace is added to the `namespaces` list, with the highest priority.
- Also, since `de` is a language, the language setting is changed to `de`.

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

Instead of the French-English dictionary (from `fr`), the shortcut for the German-English dictionary (from `de`) is called – because dictionaries are picked via [[Includes]] based on the `language` setting.

## Default language and country

Calling the homepage URL without any namespaces will set the default language and country based on [navigator.language](https://developer.mozilla.org/en-US/docs/Web/API/NavigatorLanguage/language).