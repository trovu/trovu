# Content policy

This policy is for our **[curated shortcuts](https://github.com/trovu/trovu/tree/master/data/shortcuts)** and how they should look.

Note that you can [add any shortcut to your user repository](../users/advanced.md#personal-shortcuts), completely ignoring this policy.

_Caveat: You may notice that many curated shortcuts do not currently match the listed criteria. This is because Trovu's first version (named **Serchilo**) has existed since 2005, with user-created shortcuts available since 2007, while this policy only started being written in 2023. The goal is therefore to define standards and then apply them gradually, while breaking existing user habits as little as possible._

## Shortcuts

### Avoid pure bookmark shortcuts

Bookmark shortcuts refer to shortcuts with 0 arguments, e.g.:

    g 0:
      url: https://www.google.com/search?hl=<$language>
      title: Google Web Homepage

You use it by simply entering `g` and hitting Enter.

This shortcut to the Google Web Homepage is fine because it is not alone: There is also a shortcut for the Google Web search `g 1`.

But a bookmark shortcut that has no corresponding 1-or-more-argument shortcut should be avoided. You may put them into [your user shortcuts](../users/advanced.md#personal-shortcuts).

## Namespaces

If a shortcut is relevant only for a certain country, add it to its country [namespace](../shortcuts/namespaces.md) (they start with a dot, e.g. `.us`, `.de`).

Language-related shortcuts go into their language namespace (e.g. `en`, `de`).

If a website has different language versions, create a shortcut for each language in its language namespace, and for the English version, in the planet namespace (`o`).

If a website is only in English, create the shortcut in `o`.

## Keywords

### Avoid common words

Many users use Trovu with a [default keyword](../users/advanced.md#default-keyword): They can enter any query, and if it's not matched with a shortcut, the default keyword will be used – often it refers to Google.

Thus, such users often perform their Google searches without `g`, because it will be applied automatically if no shortcut is found.

However, if there _is_ a shortcut with a keyword `apple` or `app`, this breaks.

This is why we want to avoid such common words as keywords:

- Instead of `app`, we use `gpa` (_Google Play App search_), and
- instead of `apple`, we use `apl` (omitting the vowels, shorter)

### Abbreviate properly

The rule of thumb: The more popular the website, the shorter may be its keyword. If we abbreviate, here are the rules.

### 1-letter keywords: Only for top 50

The English alphabet has 26 Latin letters. A keyword of only 1 letter should therefore be used only if the website belongs to the top 50 worldwide by visitor count (namespace `o`), to minimize the likelihood of clashes.

If the shortcut should belong to a language or country namespace, then its website should be in the top 50 for that country.

### 2-letter keywords: Language codes have priority

If a two-letter combination corresponds to an [ISO-639-1 language code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes#Table_of_all_possible_two_letter_codes) (e.g., `en`, `fr`, `de`), the keyword should be treated as a dictionary for that language.

It may only be used as a keyword for other purposes if it does not match a language code.

### Abbreviate by first sounds of words and/or syllables

A good keyword should be easy to remember and should not be a word itself. We try to achieve this by taking the first letters of the website's name (if it contains multiple words) or syllables. For example:

- `fb` for _FaceBook_
- `db` for _Deutsche Bahn_
- `ad` for _AnDroid_
- `bmf` for _Besser MitFahren_
- `bmn` for _BugMeNot_
