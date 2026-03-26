---
title: "Story of Trovu: From Generated Forms to the Command Line"
description: As Trovu turns 20, I'm writing a miniseries of articles about its history. Part one covers its first version, called "Serchilo".
date: 2025-05-22
tags:
    - history
---

_This article was published before in German on [Techniktagebuch](https://techniktagebuch.tumblr.com/post/752527931803418624/2005)._

In my [previous article](/startpage-generator), I wrote about mstart.de, one of several predecessors of (as of 2024, the time of writing) today’s [trovu.net](https://trovu.net/), which Kilian [previously described from a user’s perspective](https://techniktagebuch.tumblr.com/post/749989061656182784/seit-2007). This is where the story continues: how a homepage generator turned into a command line for the web.

With mstart, I had collected all my frequently used search forms on one (locally downloaded) web page. To search Google, I just had to click in the appropriate field; Infoseek and stock searches were also easily accessible. But I still needed several clicks or keystrokes, and due to space limitations, only a limited number of services could fit.

At the same time, I knew a great feature from the [Opera browser](https://de.wikipedia.org/wiki/Opera_%28Browser%29): assigning shortcuts for specific web searches. So I could set “g” for Google and simply type `g berlin` to get Google’s search results for “berlin.”

What didn’t work, though: defining a shortcut with multiple arguments — for example, having `db Berlin, Hamburg` open the Deutsche Bahn connection search. Nor could I easily use my own shortcuts on another computer (I’d have to migrate my browser config) or access other users’ shortcuts and maintain them collaboratively.

And that’s exactly why I developed **Serchilo** in 2005: There’s just one input field, and I can type commands like `g berlin`, but also `db berlin hamburg` — and it takes me directly to the appropriate results page. The shortcut database is stored online: all shortcuts are available on any new computer — I just need to visit [serchilo.net](http://serchilo.net) (or set it as the browser’s default search engine).

The name, by the way, comes from [Esperanto](https://de.wikipedia.org/wiki/Esperanto) (meaning “search tool”), due to my (then and still ongoing) enthusiasm for the language: learning it after English and French in school is like discovering Python when you’ve only known C++.

I wasn’t the only one with the command-line idea: alternatives included YubNub, Yeah Way, Yahoo Open Shortcuts, Sugarcodes, Dozomo, and DuckDuckGo Bangs.

As a database and interface for managing shortcuts, I used [MediaWiki](https://de.wikipedia.org/wiki/MediaWiki) (the same platform powering Wikipedia at the time): it already had user management and version control built-in. However, creating a new shortcut was quite complex: each required its own wiki page, and initially, you even needed to know [regular expressions](https://de.wikipedia.org/wiki/Regul%C3%A4rer_Ausdruck). Here’s what the Google command looked like, for example:

> ```
> query: /^g([\w]{2})? (.*)$/
> url: http://www.google.com/search?hl=$subdomain&lr=lang_$1&q=$2&ie=utf-8
> ```

That was probably a bottleneck at first, accessible mainly to programmers — but the Serchilo way of searching already fit their style.

Over the next nearly 20 years, I kept working on it — it became my main hobby project. Creating new shortcuts got easier, user-specific commands became possible, internationalization was added (a German user might want a different Wikipedia than a French one), and eventually there was even a Firefox extension and Android app.

Serchilo became my sandbox for experimenting with new technologies:

-   After MediaWiki, I reimplemented it in [Ruby on Rails](https://de.wikipedia.org/wiki/Ruby_on_Rails) in 2011 (but never launched it live — I didn’t end up liking it).
-   In 2012, I moved to [Drupal](https://de.wikipedia.org/wiki/Drupal), because that’s what my freelancing friends used — which I wanted to try too.
-   In 2014, I built it again in Drupal, but better, with everything I had learned — and [open-sourced it](https://github.com/georgjaehnig/serchilo-drupal).

In 2015, I also renamed it to **FindFind.it**, to have something easier to spell and remember — but I never really liked the name.

Looking back, there was a lot of [Shiny Object Syndrome](https://en.wikipedia.org/wiki/Shiny_object_syndrome) and unfortunately less user communication: some changes confused users, usage numbers stagnated, and only later did I get into the habit of responding quickly to feedback.

Eventually, a sense of responsibility also emerged: for many users, they told me, it had become an essential part of their browser setup — they couldn’t use the internet without Serchilo. So shutting it down was never an option. Making it open source was also motivated by the idea that it could survive without me.

One change, though, had to happen: all user search queries were going through my server — and at some point, I no longer found that acceptable from a privacy perspective.

Interestingly, in 2018 I learned that parameters can also be sent after the hash in a URL (like `example.com/#query=search`) — and that they are processed only locally.

And so the idea for today's **trovu.net** was born — which I’ll cover in the next and final article.
