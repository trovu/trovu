---
title: How I Use Trovu (Kilian)
description: The Command Line for the WWW
date: 2024-06-07
tags:
    - beginner
    - testimonial
---

_Dieser Artikel erschien zuerst auf Deutsch [im Techniktagebuch](https://techniktagebuch.tumblr.com/post/749989061656182784)._

At the top of the browser, in the address bar, you can enter not only URLs. You can also enter a search term and be directed to the search results page of the default search engine, usually Google. This saves you the step of opening the search engine's homepage and finding your way around – ensuring the cursor is in the search field, etc.

But there are many websites offering search functions where I don't want to navigate their homepages each time I search. That's why I have set my default search engine to [trovu.net](http://trovu.net/). This means I have to start each search query in the address bar with a cryptic shortcut. However, I have numerous websites at my fingertips. Depending on the shortcut, I'm immediately directed to the search results on the corresponding website. Without moving my fingers from the keyboard, Ctrl+L takes me directly to the address bar. For a Unix nerd like me, it's ideal, almost like a #commandline for the web. [This YouTube Short](https://www.youtube.com/shorts/gOUNhCion9M) illustrates the principle.

Trovu is developed by Georg Jähnig, following his predecessors Serchilo and FindFind.it. He presented Serchilo in 2007 at the Computer Linguistics Student Conference (TaCoS) in Tübingen, which I co-organized. Since then, I have continuously used Serchilo and its successors. Mobile browsers and search widgets for smartphone home screens have been configurable in a similar manner since the 2010s. Trovu is free, open-source, data-efficient, and ad-free, funded by affiliate links – for example, if I search on Amazon through Trovu and make a purchase, Georg gets a small commission.

Many useful shortcuts are predefined, but you can also define your own and overwrite predefined shortcuts. In 2024, I switched from Google to DuckDuckGo without retraining my muscle memory: the shortcut `g` is still for web search, now redefined to call DuckDuckGo, and `gi` for image search. In 2013, when Google Reader was discontinued, I redefined `r` to call Feedly. For websites I frequently visit, I often don't use a search term but use the shortcut like a bookmark. Trovu usually calls the homepage of the respective website, but this can be configured. Editing shortcuts was done nerdily via a MediaWiki with Serchilo, via a Drupal-based website with FindFind.it, and nerdily again with Trovu by pushing a configuration file on GitHub.

Here is a subjective and arbitrary selection of my 5 most important use cases for Trovu and the associated shortcuts:

1. **Looking up a word in a bilingual online dictionary**: For example, to know what _Zahn_ means in Danish, I enter the ISO-639-2 code for Danish, `da`, followed by the search word: `da zahn`. Trovu directs me to a German-Danish online dictionary, knowing my default language is German. To search in an English-Danish dictionary, I prefix the shortcut with the respective namespace shortcut, changing my default language for this query to English: `en.da tooth`. Entering `fr zahn` takes me to a German-French dictionary, LEO.org. To use dict.cc, there's also a namespace: `dcc.fr zahn`.
2. **Personal shortcuts for my websites**: `vw` for the wiki of the [Society for Strengthening Verbs](https://neutsch.org/), `vv` to go directly to the list of strong verbs, `vf` for the forum, `lt` to call a keyword at [Freut euch des Labenz!](https://labenz.neutsch.org/), `ls` to search all definitions there, `tn` to search my [tweet archive](https://tweetnest.texttheater.net/), `tttt` to search my [blog](https://texttheater.net/).
3. **Navigating the various functions of classifieds (formerly eBay classifieds)**: `kaz` for searching or opening the homepage, `kazn` for messages, `kaza` for my ads, `kazm` for my watchlist, and `kaz+` for the new ad form.
4. **Amazon searches**: `a` searches Amazon, `ao` my order history. Using the form on the website, I would constantly confuse the two search fields.
5. **Handling URLs behind paywalls, poorly formatted recipes, or missing pages**: Prefixed with the appropriate shortcut in Trovu, problematic URLs are handled: `atd` for Archive.today, `ckd` for Cooked.wiki, and `wbm` for the Wayback Machine.

[1] I don't have to. If my search query doesn't start with a word defined as a shortcut in Trovu, it directs me to my preferred default search engine in Trovu, DuckDuckGo.
