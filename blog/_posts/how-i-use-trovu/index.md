---
title: How I use trovu.net
description: A practical beginners' guide
date: 2024-05-22
tags:
    - mobile
    - app
---

Many of my friends know Trovu for years, and there's exactly two groups of them

-   "Nice, but I don't see why this would be useful to me"
-   "This is awesome, I can't use the Internet without it anymore."

There's nothing in between. No one seems to be using it just somewhat, from time to time.

I'm part of the latter group, and to get you also there, I will show you here how I'm using Trovu.

## My setup

First, how Trovu is integrated in my devices:

-   I use [custom settings and shortcuts](https://trovu.net/docs/users/advanced/) in [my own trovu-data-user repo](https://github.com/georgjaehnig/trovu-data-user/).
-   On my desktop browser, I have [integrated Trovu as a search engine](https://trovu.net/docs/users/integration#chrome) and made it default. My URL is

```
https://trovu.net/process/?#github=georgjaehnig&query=%s
```

-   On my Android phone, I use either the [new Trovu PWA](https://trovu.net/docs/users/integration#pwa-progressive-web-app), or the 3rd-party app [SearchBar Ex](https://trovu.net/docs/users/integration#searchbar-ex-search-widget):
    -   SearchBar Ex immediately opens up the Android keyboard after opening, but has no suggestions
    -   the PWA has suggestions, but the virtual keyboard only opens after an additional tap into the search input (let me know if you know how to make it show immediately)

## (Advanced) Googling

My most frequent shortcut is `g` for Google. But sometimes, I also need a more complicated Google search, and Trovu has shortcuts for these:

### Google for results only in a certain language:

{% trovuCall "gol pl, berlin" %}
will yield results about Berlin only on Polish websites.

### Google search only on Wikipedia sites:

{% trovuCall "wg berlin" %}
This is like adding `site:en.wikipedia.org` to my Google search query. It will list only results from that domain, thus all Wikipedia articles that mention _berlin_.

I prefer this over the actual Wikipedia shortcut `w`, as it's much faster, and also allows for more fuzzy searches.

I can also go for other languages by prefixing it with the language code:
{% trovuCall "fr.wg berlin" %}
This will do a Google search with `site:fr.wikipedia.org`

### Same for Reddit and X (Twitter):

```
rg berlin
xg berlin
```

These will only show results from `reddit.com` or `x.com`. Thus again, they make a fast and fuzzy-allowing Reddit or X search, sometimes better than their build-in searches.

So basically, anything of that can be done with Google directly – but it's much shorter with Trovu's shortcuts.

## Navigation & Travel

### Train connections

I live in Germany and often take the train. There's an old and hidden UI for the train timetables, originaly made for the text-based [Lynx web browser](<https://en.wikipedia.org/wiki/Lynx_(web_browser)>). It works to this day and is very fast, one only needs to know its URL – or use the Trovu shortcut.

{% trovuCall "dbt berlin, hamburg" %}

will show the next train from Berlin to Hamburg.

I can also add the time, and if I want, also the date:
{% trovuCall "dbt berlin, hamburg, 10, 8.12." %}
Note that while this interface is fast, it does not show current delays or non-planned interruptions (roughly any outage newer than 24 hours). Thus, when I want to know that, I use the regular interface:
{% trovuCall "db berlin, hamburg" %}

#### Typed arguments

All of these arguments are [typed](https://trovu.net/docs/shortcuts/url#argument-types), thus I can also do this:
{% trovuCall "db b, hh, +2, fr" %}
_from_ and _to_ are of type [city](https://trovu.net/docs/shortcuts/url#city): They can also take an [abbreviation of a city name](https://github.com/trovu/trovu/tree/master/data/types/city). Usually, these are the ones used on vehicle-registration plates.

The _time_ and _date_ are of, yes, [time](https://trovu.net/docs/shortcuts/url#time) and [date](https://trovu.net/docs/shortcuts/url#date):

-   I can count up from the current time or date, thus `+2` is _now in 2 hours_ or _now in 2 days_.
-   For _date_, I can also use day-of-week abbreviations, e.g. `mo`.

#### Filter for regional trains

Cheaper connections can be found if I limit my search to only regional trains (suitable for the [Deutschlandticket](https://en.wikipedia.org/wiki/Deutschlandticket)). I can do so by calling:
{% trovuCall "dbn berlin, hamburg" %}

### Google Maps

For finding a place on Google Maps, I use
{% trovuCall "gm berlin" %}
If I need a certain street in some city, I use two arguments
{% trovuCall "gm hamburg, hauptstraße" %}
Here, that first argument is typed again as _city_, so I can use a city name abbreviation:
{% trovuCall "gm hh, hauptstraße" %}

#### Navigation

To find directions from one place to another, I call:
{% trovuCall "gd berlin, hamburg" %}
Again, city name abbreviations work, too:
{% trovuCall "gd b, hh" %}

### Google Flights

My favourite way to search flights is via Google Flights:
{% trovuCall "gfl ber, ibiza, fr, mo" %}
It opens Google Flights and show directly the results for return flights from `BER` (Berlin) to Ibiza, going there on the next Friday and coming back on the next Monday.

For one-way flights, I use:
{% trovuCall "gfl1 ber, ibiza, 10" %}
The date here denoted the 10th of the current month. If it is already in the past, I will translate to the 10th of next month.

## Programming

I'm a developer, so I often need to look up libraries and forums:
{% trovuCall "npm yaml" %}
will search for Node packages about YAML.
{% trovuCall "sof yaml" %}
will search Stackoverflow for questions around YAML

## Dictionaries

I speak a few languages and learn often new ones. For a dictionary of most languages, I only need their ISO code:

```
en baum
fr baum
pl baum
```

These shortcuts will call dictionaries from English, French, Polish into German – because German is [the language I defined in my setup](https://trovu.net/docs/users/advanced#language).

Though, I can override this language by prefixing with another code:

```
es.en baum
es.fr baum
es.pl baum
```

will call the dictionaries into Spanish instead.

## Media

{% trovuCall "yt berlin" %}
searches for YouTube videos about Berlin.
{% trovuCall "ytd berlin" %}
does the same, but sorts them by date (newest first).

There are also a few torrent search engines, my preferred one is BTDigg:
{% trovuCall "btg berlin" %}

## Shopping

I search books and other products on Amazon:
{% trovuCall "a smartphone" %}

For things from China, I look on Temu and AliExpress:

```
tmu camera
axp camera
```

## Do I remember all shortcut keywords?

The ones I mentioned, yes. These are not so many, and I use them regularly.

If there's a shortcut that I know or assume it exists but I just don't know its keyword or syntax, I call "my" Trovu page, that is, Trovu with my current settings:
{% trovuCall "trovu" %}
I am then on `https://trovu.net/?#github=georgjaehnig` and have the suggestions available just while typing.

## Curious about yours

If you are already a Trovu user too, I'd be curious about your setup and practice. Please contact me via info@trovu.net or [x.com/trovu](https://x.com/trovu_net) and we'll publish it here.
