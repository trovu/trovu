# shortcut.url

The `url:` item of a shortcut may contain placeholders. This page is about them.

## Example

Consider for instance the URL of the Google shortcut:

```yaml
url: https://www.google.com/search?hl=<$language>&q=<query>&ie=utf-8
```

It contains 2 placeholders: `<query>` and `<$language>`.

## Placeholders

Placeholders are either

-   arguments (starting with `<` and ending with `>`): They are replaced with the input from the current query,
-   variables (starting with `<$` and ending with `>`): They are replaced with settings from the current configuration.

The contents of a placeholder follows [YAML Flow Style](https://www.yaml.info/learn/flowstyle.html).

### Argument placeholders

| Example                                                          | Will be replaced with                                                                                                                              |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<foobar>`                                                       | argument from query. <br>If there is more than one argument placeholder, their order in URL also defines the expected order in the shortcut query. |
| `<foobar: {encoding: iso-8859-1}>`                               | ... with encoding specified. See Input encoding below.                                                                                             |
| `<Datum: {type: date, output: Y-m-d}>`<br>`<Ziel: {type: city}>` | ... with a specified type. See Argument types below.                                                                                               |
| `<IATA-Code: {transform: uppercase}>`                            | ... with a transformation definition. See [Transforming](#transforming) below.                                                                     |

### Variable placeholders

| Example                   | Will be replaced with                                                                                                                                                       |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<$language>`             | configured language                                                                                                                                                         |
| `<$now: {output: HH-mm}>` | current date and time, attribute `output` defines the output format which must be based on [dayjs's format](https://day.js.org/docs/en/display/format). Default is `HH-mm`. |

## Input encoding

...

## Argument types

### _date_

The input will be parsed as a date.

-   American and European inputs will be distinguished.
-   An input containing only a number will be assumed as a day of month.
-   A date in the future will be enforced.
-   Also relative inputs are possible.
-   Weekday abbreviations are understood, too. The language is assumed from the configured language.
-   With the attribute `output`, an output format based on [dayjs's format](https://day.js.org/docs/en/display/format) can be specified. Defaults to YYYY-MM-DD.

| Example input | Example output | Explanation                                                                                     |
| ------------- | -------------- | ----------------------------------------------------------------------------------------------- |
| `7.6.`        | `2015-06-07`   | assumes German format                                                                           |
| `7/6`         | `2015-07-06`   | assumes American format                                                                         |
| `7`           | `2015-06-07`   | assumes current month & year                                                                    |
| `1`           | `2015-07-01`   | enforced future date: increases month and even year if computed date would be in past otherwise |
| `+10`         | `2015-06-17`   | today plus 10 days                                                                              |
| `-5`          | `2015-06-02`   | today minus 5 days                                                                              |
| `mo`          | `2015-06-08`   | next Monday                                                                                     |

### _time_

The input will be parsed as a time.

-   Hours and minutes can be separated by `.` or `:`.
-   It is allowed to only provide an hour.
-   Relative hours work, too.
-   With the attribute `output`, an output format based on [dayjs's format](https://day.js.org/docs/en/display/format) can be specified. Defaults to `HH:mm`.

| Example input | Example output | Explanation       |
| ------------- | -------------- | ----------------- |
| `11.00`       | `11:00`        | Hours and minutes |
| `11`          | `11:00`        | only hour given   |
| `+2`          | `13:00`        | 2 hours from now  |

### _city_

The input will be parsed as an abbreviation for a city name, depending on the current setting for `country`. Usually, the mappings are based on the local vehicle registration plates' abbreviations.

| `country` | Example input | Example output |
| --------- | ------------- | -------------- |
| `de`      | `hh`          | `Hamburg`      |
| `pl`      | `dw`          | `Wrocław`      |
| `ch`      | `be`          | `Bern`         |

The mappings are stored in [/data/types/city](https://github.com/trovu/trovu/tree/master/data/types/city).

## Transforming

Finally, with `<foo: {transform: uppercase}>` the output string can be transformed.

| Property    | Conversion                           | Example input             | Example output      | Explanation                                |
| ----------- | ------------------------------------ | ------------------------- | ------------------- | ------------------------------------------ |
| `uppercase` | The output will be uppercased.       | `sxf`                     | `SXF`               | Makes sure all letters are uppercase.      |
| `lowercase` | The output will be lowercased.       | `Sxf`                     | `sxf`               | Makes sure all letters are lowercase.      |
| `eo-cx`     | `cx gx hx jx sx ux` to `ĉ ĝ ĥ ĵ ŝ ŭ` | `ehxosxangxo cxiujxauxde` | `eĥoŝanĝo ĉiuĵaŭde` | Converts transcribed Esperanto characters. |

## Filling and submitting with userscripts

If a website does not allow passing arguments via (GET) parameters, a solution can be targetting the search form, and then [letting the fields fill by a userscript](userscripts.md#fill-and-submit).
