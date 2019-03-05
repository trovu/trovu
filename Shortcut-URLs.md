A shortcut URL may contain placeholders. This page is about them.

## Example

Consider for instance the URL of the Google shortcut:

    https://www.google.com/search?hl={$language}&q={%query}&ie=utf-8

It contains 2 placeholders: `{%query}` and `{$language}`.

## Placeholders

Example	| Will be replaced with
---|---
`{%foobar}` | argument from query. <br>If there is more than one argument placeholder, their order in URL also defines the expected order in the shortcut query.
`{%foobar\|encoding=iso-8859-1}` | ... with encoding specified. See Input encoding below.
`{%Datum\|type=date\|output=Y-m-d}`<br>`{%Ziel\|type=city}` | ... with a specified type. See Argument types below.
`{%IATA-Code\|transform=uppercase}` | ... with a transformation definition. See Transforming below.
`{$language}` | configured language
`{$now\|output=HH-mm}` | current date and time, attribute output defines the output format which must be based on [momentjs's format](https://momentjs.com/docs/#/parsing/string-formats/). Default is `HH-mm`.
