---
title: How I Use trovu.net (Georg)
description: A Practical Beginner's Guide
date: 2024-05-22
tags:
    - config
    - beginner
    - testimonial
---

I have started creating this project in 2005, many of my friends have known it for years, and they fall into exactly two groups:

-   "Nice, but I don't see why this would be useful to me."
-   "This is awesome, I can't use the Internet without it anymore."

There's nothing in between. No one seems to be using it just occasionally.

I'm part of the latter group, and to help you join us, I will show you how I use Trovu.

## My Setup

First, here's how Trovu is integrated into my devices:

-   I use [custom settings and shortcuts](https://trovu.net/docs/users/advanced/) in [my own trovu-data-user repo](https://github.com/georgjaehnig/trovu-data-user/).
-   On my desktop browser, I have [integrated Trovu as a search engine](https://trovu.net/docs/users/integration#chrome) and made it the default. My URL is:

```
https://trovu.net/process/?#github=georgjaehnig&query=%s
```

-   On my Android phone, I use either the [new Trovu PWA](https://trovu.net/docs/users/integration#pwa-progressive-web-app) or the third-party app [SearchBar Ex](https://trovu.net/docs/users/integration#searchbar-ex-search-widget):
    -   SearchBar Ex immediately opens the Android keyboard after launching, but it has no suggestions.
    -   The PWA has suggestions, but the virtual keyboard only opens after an additional tap into the search input. (Let me know if you know how to make it show immediately.)

## (Advanced) Googling

My most frequent shortcut is `g` for Google. But sometimes, I need a more complicated Google search, and Trovu has shortcuts for these:

### Google for results only in a certain language:

{% trovuCall "gol berlin", {language: "de" } %}

will yield results about Berlin only on websites in German – because German is [the language I defined in my setup](https://trovu.net/docs/users/advanced#language).

For other languages, I can prefix with the language code:

{% trovuCall "pl.gol berlin" %}

will show results only from Polish websites.

### Google search only on Wikipedia sites:

{% trovuCall "wg berlin", { language: "de" } %}

This is like adding `site:de.wikipedia.org` to my Google search query. It will list only results from that domain, thus all Wikipedia articles that mention _Berlin_.

I prefer this over the actual Wikipedia shortcut `w` because it's much faster and allows for more fuzzy searches.

I can also search other languages by prefixing it with the language code:

{% trovuCall "fr.wg berlin" %}

This will perform a Google search with `site:fr.wikipedia.org`.

### Same for Reddit and X (Twitter):

{% trovuCall "rg berlin" %}
{% trovuCall "xg berlin" %}

These will only show results from `reddit.com` or `x.com`, making for a fast and fuzzy-allowing Reddit or X search, sometimes better than their built-in searches.

So, while anything can be done directly with Google, it's much shorter with Trovu's shortcuts.

## Navigation & Travel

### Train Connections

I live in Germany and often take the train. There's an old and hidden UI for the train timetables, originally made for the text-based [Lynx web browser](<https://en.wikipedia.org/wiki/Lynx_(web_browser)>). It works to this day and is very fast; one only needs to know its URL—or use the Trovu shortcut.

{% trovuCall "dbt berlin, hamburg", { country: "de" } %}

will show the next train from Berlin to Hamburg.

I can also add the time, and if I want, the date:

{% trovuCall "dbt berlin, hamburg, 10, 8.12.", { country: "de" } %}

Note that while this interface is fast, it does not show current delays or non-planned interruptions (roughly any outage newer than 24 hours). For that, I use the regular interface:

{% trovuCall "db berlin, hamburg", { country: "de" } %}

#### Typed Arguments

All of these arguments are [typed](https://trovu.net/docs/shortcuts/url#argument-types), so I can also do this:

{% trovuCall "db b, hh, +2, fr", { country: "de" } %}

_from_ and _to_ are of type [city](https://trovu.net/docs/shortcuts/url#city), so they can take an [abbreviation of a city name](https://github.com/trovu/trovu/tree/master/data/types/city). Usually, these are the ones used on vehicle registration plates.

The _time_ and _date_ are, yes, [time](https://trovu.net/docs/shortcuts/url#time) and [date](https://trovu.net/docs/shortcuts/url#date):

-   I can count up from the current time or date, so `+2` means _in 2 hours_ or _in 2 days_.
-   For _date_, I can also use day-of-week abbreviations, e.g., `mo`.

#### Filter for Regional Trains

Cheaper connections can be found if I limit my search to only regional trains (suitable for the [Deutschlandticket](https://en.wikipedia.org/wiki/Deutschlandticket)). I can do so by calling:

{% trovuCall "dbn berlin, hamburg", { country: "de" } %}

### Google Maps

To find a place on Google Maps, I use:

{% trovuCall "gm berlin" %}

If I need a certain street in some city, I use two arguments:

{% trovuCall "gm hamburg, hauptstraße" %}

Here, the first argument is typed again as _city_, so I can use a city name abbreviation:

{% trovuCall "gm hh, hauptstraße", { country: "de" } %}

#### Navigation

To find directions from one place to another, I call:

{% trovuCall "gd berlin, hamburg" %}

Again, city name abbreviations work too:

{% trovuCall "gd b, hh", { country: "de" } %}

### Google Flights

My favorite way to search flights is via Google Flights:

{% trovuCall "gfl ber, ibiza, fr, mo" %}

It opens Google Flights and shows direct results for return flights from `BER` (Berlin) to Ibiza, going there on the next Friday and coming back on the next Monday.

For one-way flights, I use:

{% trovuCall "gfl1 ber, ibiza, 10" %}

The date here denotes the 10th of the current month. If it is already in the past, it translates to the 10th of next month.

## Programming

As a developer, I often need to look up libraries and forums:

{% trovuCall "npm yaml" %}

will search for Node packages related to YAML.

{% trovuCall "sof yaml" %}

will search Stack Overflow for questions around YAML.

## Dictionaries

I speak a few languages and often learn new ones. For a dictionary of most languages, I only need their ISO code:

{% trovuCall "en baum", {language: "de" } %}
{% trovuCall "fr baum", {language: "de" } %}
{% trovuCall "pl baum", {language: "de" } %}

These shortcuts will call dictionaries from English, French, and Polish into German — again because German is [the language I defined in my setup](https://trovu.net/docs/users/advanced#language).

Though, I can override this language by prefixing with another code:

{% trovuCall "es.en baum", {language: "de" } %}
{% trovuCall "es.fr baum", {language: "de" } %}
{% trovuCall "es.pl baum", {language: "de" } %}

These will call the dictionaries into Spanish instead.

## Media

{% trovuCall "yt berlin" %}

searches for YouTube videos about Berlin.

{% trovuCall "ytd berlin" %}

does the same but sorts them by date (newest first).

There are also a few torrent search engines; my preferred one is BTDigg:

{% trovuCall "btd berlin" %}

## Shopping

I search for books and other products on Amazon:

{% trovuCall "a smartphone" %}

For things from China, I look on Temu and AliExpress:

{% trovuCall "tmu camera" %}
{% trovuCall "axp camera" %}

## Do I Remember All Shortcut Keywords?

The ones I mentioned, yes. These are not many, and I use them regularly.

If there's a shortcut that I know or assume exists but I just don't know its keyword or syntax, I call "my" Trovu page, that is, Trovu with my current settings:

{% trovuCall "trovu" %}

I am then on `https://trovu.net/?#github=georgjaehnig` and have the suggestions available just while typing.

## Curious About Yours

If you are already a Trovu user, too, I'd be curious about your setup and practice. Please share it in our [Github Discussions](https://github.com/trovu/trovu/discussions), or as a reply to the [X post](https://x.com/jorges/status/1793395395344658920).
