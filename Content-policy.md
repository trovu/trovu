This page is about which shortcuts may be in the **curated repository** [trovu-data](https://github.com/trovu/trovu-data), and how they should look like.

Note that you can [add any shortcut to your user repository](https://github.com/trovu/trovu.github.io/wiki/Advanced-settings-&-personal-shortcuts#personal-shortcuts), completely ignoring this policy.

*Caveat: You might note that many curated shortcuts at this moment don't match the listed criteria. This is because Trovu's first version (named **Serchilo**) existed since 2005, with user-created shortcuts available since 2007, and this policy was started to be written in 2023. Thus, the goal is to finally define some standards and then slowly applying then, with as little as possible breaking of existing user habits.*

## Shortcuts

### Avoid pure bookmark shortcuts

Bookmark shortcuts refer to shortcuts with 0 arguments, e.g.:

    g 0:
      url: https://www.google.com/search?hl={$language} 
      title: Google Web Homepage

You use it by simply entering `g` and hitting Enter. 

This shortcut to the Google Web Homepage is fine because it is not alone: There is also a shortcut for the Google Websearch `g 1`.

But a bookmark shortcut that has no corresponding 1-or-more-argument shortcut should be avoided. You may put them into [your user shortcuts](https://github.com/trovu/trovu.github.io/wiki/Advanced-settings-&-personal-shortcuts#personal-shortcuts).

## Keywords

### Avoid common words

Many users use Trovu with a [default keyword](https://github.com/trovu/trovu.github.io/wiki/Advanced-settings-&-personal-shortcuts#default-keyword): They can enter any query, and if it's not matched with a shortcut, they default keyword will be used – often it refers to Google.

Thus, such users often perform their Google searches with out `g` – because it will be applied automatically if not shortcut is found.

However, if there *is* a shortcut with a keyword `apple` or `app`, this breaks.

This is why we want to avoid such common words as keywords:

-  Instead of `app`, we use `gpa` (*Google Play App search*), and
-  instead of `apple`, we use `apl` (omitting the vowels, shorter)

### Abbreviate properly

The rule of thumb: The more popular the website, the shorter may be its keyword. If we abbreviate, here are the rules.

### 1-letter keywords: Only for top 50

The English alphabet has 26 latin letters. Keyword of only 1 letter should therefore be only applied if the website belongs to the top 50 in visitor's count of the world (namespace `o`), to minimize the likelihood of clashes. 

If the shortcut shall belong to a language or country namespace, then its website should be top 50 of that country.

### 2-letter keywords: Language codes have priority

A keyword with 2 letters shall be used for a dictionary of that language, using its [ISO-639-1 language code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes#Table_of_all_possible_two_letter_codes) (e.g. `en`, `fr`, `be`). Such shortcuts should be put into a language namespace.

If the shortcut is not about a dictionary, then it should *not* use a ISO-639-1 language code. This is to keep the space for a potential future dictionary shortcut.