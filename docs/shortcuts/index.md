# Shortcuts

Shortcuts are defined in YAML files, organized by [namespaces](namespaces.md). In each file, shortcuts are an associative array, with `KEYWORD ARGUMENT_COUNT` as its key. Keys must be unique.

For the value, there is a short and a long notation possible. Curated shortcuts in `/data` should follow the long notation.

### Short notation

In the short notation, the [URL](url.md) is directly the value of the shortcut.

This shortcut will match for `examplekeyword` with no arguments:

```yaml
examplekeyword 0: http://www.example.com/
```

This shortcut will match for `examplekeyword foo`, so for the same keyword but with one argument:

```yaml
examplekeyword 1: http://www.example.com/?q=<param1>
```

And with more arguments: `examplekeyword foo, bar`:

```yaml
examplekeyword 2: http://www.example.com/?q=<param1>&p=<param2>
```

### Long notation

In the long notation, further info can be defined:

```yaml
examplekeyword 2:
    url: http://www.example.com/?q=<param1>&p=<param2>
    title: Custom shortcut
    description: My custom shortcut with the keyword examplekeyword and two arguments.
    tags:
        - example
        - custom
```

These attributes serve only for informational purposes, they have no effect on which shortcut is matched to a query:

-   The `title:` can be any string. It will be shown in the list of shortcuts on the homepage.
-   `description:` can be a longer string. It will be shown in the list of shortcuts when a shortcut is expanded.
-   `tags:` can be a list of labels.
-   `examples:` can be a list of example usages of the shortcuts:
-   `tests:` can be a list of test calls to check the validity of the shortcut.

### Special tags

Some tags have a special meaning.

#### `is-affiliate`

Shortcuts tagged with `is-affiliate` are created in partnership with the destination websites, and we receive a commission when users make purchases through these links, with no extra cost to the users. This process is known as [Affiliate marketing](https://en.wikipedia.org/wiki/Affiliate_marketing).

For example, the Amazon shortcut is an affiliate link: when you use it and make a purchase, Trovu earns a small percentage of the sale.

Affiliate shortcuts enable us to generate revenue without disrupting the user experience.

#### `needs-userscript`

To use shortcuts tagged with `needs-userscript`, please ensure that the [userscript](userscripts.md) is installed for them to work correctly.

#### Examples

```yaml
examplekeyword 2:
    ...
    examples:
    - arguments: foo, bar
      description: Search example.com for "foo" and "bar"
```

An example must have a `description` and, if there are >0 arguments, also an `arguments:` string. For the query of the example call, the arguments will be preceded with the keyword.

Instead of `arguments:`, one can also set a full `query:`. This can be useful for giving an example with an extra namespace, e.g. `query: fr.w berlin`.

#### Tests

Tests are run regularly in the background, to check if shortcuts still work as they did when they were added.

```yaml
examplekeyword 2:
    ...
    tests:
    - arguments: foo, bar
      expect: <title>Results for foo, bar</title>
```

A test must have an `expect:` value that shall be part of the contents of the target webpage. If there are >0 arguments, add also an `arguments:` string.

#### More

The next attributes matter for matching a query:

-   [`url:`](url.md)
-   [`include:`](include.md)
-   [`deprecated:`](deprecated.md)
