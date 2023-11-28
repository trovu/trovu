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
examplekeyword 1: http://www.example.com/?q=<query>
```

And with more arguments: `examplekeyword foo, bar`:

```yaml
examplekeyword 2: http://www.example.com/?q=<query>&p=<puery>
```

### Long notation

In the long notation, further info can be defined:

```yaml
examplekeyword 2:
    url: http://www.example.com/?q=<query>&p=<puery>
    title: Custom shortcut
    description: My custom shortcut with the keyword examplekeyword and 2 arguments.
    tags:
        - example
        - custom
```

These attributes serve only for informational purposes, they have no effect on which shortcut is matched to a query:

-   The `title:` can be any string. It will be shown in the list of shortcuts on the homepage.
-   `description:` can be a longer string. It will be shown in the list of shortcuts when a shortcut is expanded.
-   `tags:` can be a list of labels.

The next attributes matter for matching a query:

-   [`url:`](url.md)
-   [`include:`](include.md)
-   [`deprecated:`](deprecated.md)
