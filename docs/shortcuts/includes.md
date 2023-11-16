Includes allow to use the same shortcut properties in different shortcuts. They are heavily used for dictionary shortcuts.

## Simple includes

Includes are defined with `include:`. For example, [dcm](https://github.com/trovu/trovu-data/tree/master/shortcuts/dcm.yml) contains:

    de-en 1:
      url: https://www.dict.com/german-english/{%word}
      title: German-English (dict.com)
      tags:
      - dictionary
      - english
      - german
      - language
      examples:
        baum: English translation of "baum"
        tree: German translation of "tree"

Additionally, there is:

    en-de 1:
      title: Englisch-Deutsch (dict.com)
      include:
        key: de-en 1
      examples:
        tree: Deutsch-Übersetzung von "tree"
        baum: Englisch-Übersetzung von "baum"

Both are separate shortcuts and can be called individually. But `en-de 1` includes from `de-en 1` all properties that it does not define itself. In this case, these are `url:` and `tags:`.

This way, the shortcut URL needs to be maintained only once.

## Includes with variables

`include.key` may also use variables:

    en 1:
      include:
        key: en-{$language} 1

If the language from settings is e.g. `de`, it includes from `en-de 1`. (And if `en-de 1` contains `include:`, it also includes from there, and so on.)

## Includes from another namespace

`include` may also include from another namespace:

    en 1:
      include:
        key: en 1
        namespace: leo

This can for example be set in one's user settings, to ensure using leo.org as the dictionary for English, no matter what is used in the site [[namespaces]].

## Multiple include propositions

`include:` may instead of only one `key:` (and `namespace:`) also contain several ones. For instance, in [o](https://github.com/trovu/trovu-data/tree/master/shortcuts/o.yml) we have:

    ar 1:
      include:
      - key: ar 1
        namespace: ard
      - key: ar 1
        namespace: dcm
      - key: ar 1
        namespace: bab
      - key: ar 1
        namespace: lgs
      - key: ar 1
        namespace: rvs
      - key: ar 1
        namespace: pka

This shortcut for an Arabic dictionary tries first to include from [ard](https://github.com/trovu/trovu-data/tree/master/shortcuts/ard.yml), the namespace for arabdict.com. And there also exists:

    ar 1:
      include:
        key: ar-{$language} 1

However, this namespace only contains Arabic dictionaries for a few languages (`de`, `en`, `fr`, `it`, `tr`).

If the user's language is e.g. `pl`, the include process will fail at this point, as there is no `ar-pl 1` in this namespace.

In this case, the process goes back to [o](https://github.com/trovu/trovu-data/tree/master/shortcuts/o.yml) and tries the second entry:

      - key: ar 1
        namespace: dcm

As [dcm](https://github.com/trovu/trovu-data/tree/master/shortcuts/dcm.yml) does contain `ar-pl 1`, this inclusion succeeds, and the Arabic dictionary is taken from dict.com.
