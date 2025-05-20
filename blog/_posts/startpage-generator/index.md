---
title: "Story of Trovu: The Startpage Generator"
description: "As Trovu turns 20, I'm starting a miniseries of articles about its history. Part one is about its predecessor: mstart.de."
date: 2025-05-21
tags:
    - history
---

_This article was published before in German on [Techniktagebuch](https://techniktagebuch.tumblr.com/post/752163378352504832/2001)._

A few days ago, Kilian wrote [his usergraphy](https://techniktagebuch.tumblr.com/post/749989061656182784/seit-2007) about [trovu.net](http://trovu.net/). As its developer, I’d now like to say something about its origin and its predecessor.

**2001.** Although DSL already exists, the internet is still slow in some places. Our shared flat has the bad luck of being located in the fiber-optic "valley of the clueless" in Berlin-Friedrichshain (South Kiez): the most modern lines were laid there very early on, through which ultra-fast internet would someday be available — but at that point, no provider offered service over them yet, and we no longer had the copper cables required for DSL.

So we’re online via ISDN. With six people, that can get slow, so — like in modem times — I’m looking for every possible optimization.

I notice that I always need two steps for Google searches and GMX logins:

-   one to open the homepage with the search or login form,
-   and another to load the results page after submitting the form.

What does work, though: I can define a homepage in the browser. When I open a new window, it loads that page first.

So I could set Google or GMX as my homepage — but only one of them. And even that one often reloads!

And so [mstart.de](https://web.archive.org/web/20050205115012/http://www.mstart.de/) is born, a startpage generator: I can configure once what I want — Google, Altavista, dmoz, GMX \[1] — then it generates a page with all the forms, and I can even save it locally.

The nice thing is that this works without a user database (an approach I would revisit almost 20 years later with trovu.net): users click together the forms they want, which generates a URL with many GET parameters (like `mstart.de/?google=1&gmx=1&…`), and that information is enough for the PHP script to generate a personal homepage.

With mstart.de, I now have all my essential search forms at hand, no extra load time, neatly stacked on one page, and I can jump between them with TAB or mouse and start searching right away. A great improvement.

In the following months and years, I continue using my homepage — and eventually wonder: pressing TAB a few times or clicking the mouse just to get to the right form — couldn’t that be easier?

That’s when the idea for **Serchilo** begins to take root — which I’ll write about in my next article.

\[1] _Yes, offering a GMX login and telling users to enter their email password on our site was, of course, not a good idea from a security perspective._
