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

 