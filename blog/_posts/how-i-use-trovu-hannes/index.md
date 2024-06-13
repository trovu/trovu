---
title: How I Use Trovu (Hannes)
description: "The only downside of Trovu: if you get used to it, you don't want to miss it."
date: 2024-06-12
tags:
    - beginner
    - testimonial
---

_[Hannes Neubarth](https://www.linkedin.com/in/johannesneubarth) has been using Trovu and its predecessors for more than 10 years._

{% imageFull "img/hannes.jpg", "Johannes Neubarth" %}

Hi folks, my name is Hannes, and I have been using Trovu for several years now. It is a real productivity booster, helps me save a lot of time, and I recommend everyone use it, without exception.

The reason why we all need Trovu is very simple. Most of the time when you work with a browser, you already know where you want to go: You want to see a list of search results on Google, look up your friend's address on a map, or view all bicycles in your favorite web shop.

In all these cases, the usual procedure is:

1. Open the main website,
2. Fill out one or several search fields,
3. Hit enter,
4. Wait for the results.

We all do this dozens of times a day, hundreds of times per month, probably more. Trovu helps you do the same thing much faster:

1. Write the shortcut for a website in the address bar,
2. Add some search terms,
3. Hit enter.

All you need to do is add another search engine to your browser, and you are ready to go.

If you want to give it a try, I recommend starting with a few simple commands first:

-   {% trovuCall "g pulp fiction" %} search for Pulp Fiction on Google
-   {% trovuCall "w pulp fiction" %} look it up on Wikipedia
-   {% trovuCall "a pulp fiction" %} find it on Amazon
-   {% trovuCall "gm berlin, alexanderplatz", {country: "de" } %} look up an address on Google Maps
-   {% trovuCall "yt funny cats" %} find videos with funny cats

That's it. Start with a handful of commands. If you use them regularly, you will quickly notice how helpful they are. There are more commands available, but do not get intimidated: You only need to remember the ones that you use often.

When you are ready, you can extend the list step by step. Searching for new commands is easy. Just visit [trovu.net](https://trovu.net/), enter a search term, and find the commands that are already defined. Here are a few more that I use regularly:

-   {% trovuCall "en cat" %} translate a word to/from English
-   {% trovuCall "gtr Translate a whole sentence" %} use Google Translate
-   {% trovuCall "gi funny cat" %} search on Google Images
-   {% trovuCall "osm berlin, alexanderplatz" %} search on OpenStreetMap
-   {% trovuCall "we frankfurt" %} weather forecast for Frankfurt

Sometimes I want to add a personal command that is not relevant to other people. For this reason, I have created a [GitHub repository](https://github.com/neubarth/trovu-data-user) and [defined some commands just for myself](https://trovu.net/docs/users/advanced/). This is especially useful when I am at work:

-   {% trovuCall "jira 1234", { github: "neubarth" } %} search for a ticket in my company's JIRA
-   {% trovuCall "conf release process", { github: "neubarth" } %} search in my company's Confluence
-   {% trovuCall "tt", { github: "neubarth" } %} open my company's time tracking page
-   {% trovuCall "mvn spring-boot", { github: "neubarth" } %} search for Maven/Gradle artifacts

As you see, I use Trovu at work. I also use Trovu on my phone and my second laptop. Actually, I [install it](https://trovu.net/docs/users/integration/) whenever I'm on a new computer. Because that's the only downside of Trovu – if you get used to it, you don't want to miss it. Never ever.
