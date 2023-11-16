You can create and manage your own user shortcuts and set advanced settings:

1. If you don't have one, [create a Github.com account](https://github.com/signup). It is free.
1. Fork [trovu-data-user](https://github.com/trovu/trovu-data-user) into your own Github account.
1. In there, adjust `config.yml` to your needs, and add your own shortcuts to `shortcuts.yml`. (Both are [YAML files](https://en.wikipedia.org/wiki/YAML).)
1. Call Trovu with `https://trovu.net/?#github=YOUR_GITHUB_USERNAME`

## Custom configuration

You may adjust `config.yml` to your needs.

### Namespaces

```yaml
namespaces:
    - o
    - en
    - .us
    - github: john-doe
      name: john
    - github: .
      name: my
```

This is an array of the [namespaces](https://github.com/trovu/trovu.github.io/wiki/Namespaces) you want to use. Every entry may be either

-   a string: Then it refers to an (official) site namespace, i.e. one in the [trovu-data](https://github.com/trovu/trovu-data) repository. Shortcuts in there are curated by the Trovu community.
-   key/value pairs, then they refer to a custom namespace, e.g. your (or someone else's) user namespace in Github. Every entry must contain:
    -   `github:` A Github user name, or a dot
    -   (optional) `name:` Some custom name (default: value from `github:`)

The dot will refer to the **current GitHub user** (where this `config.yml` is located).

The **order** is also relevant: The later the namespace appears in the list, the higher priority it has. So in the example above, shortcuts in `my` have highest precedence.

### Default keyword

```yaml
defaultKeyword: g
```

If no keyword is recognized in a query, this one will be used. Useful for setting up a much used shortcut.

### Language

```yaml
language: en
```

For Wikipedia in your language (or other shortcuts using `{$language}`). Basically, it fills the `{$language}` variable in the shortcut URLs. Now, using the `w` shortcut will get you to the Wikipedia in your language, as its shortcut URL is set as `https://{$language}.wikipedia.org/`.

### Country

```yaml
country: de
```

For shortcuts that use `{$country}` in their URL. Works similarly as `{$language}`.

## Personal shortcuts

Add personal shortcuts to `shortcuts.yml`.

Your shortcuts are an associative array, with `KEYWORD ARGUMENT_COUNT` as its key. Keys must be unique.

For the value, there is a short and a long notation possible.

### Short notation

This shortcut will match for `examplekeyword` with no arguments:

```yaml
examplekeyword 0: http://www.example.com/
```

This shortcut will match for `examplekeyword foo`, so for the same keyword but with one argument:

```yaml
examplekeyword 1: http://www.example.com/?q={%query}
```

And with more arguments: `examplekeyword foo, bar`:

```yaml
examplekeyword 2: http://www.example.com/?q={%query}&p={%puery}
```

### Long notation

In the long notation, you can also define title, description and tags:

```yaml
examplekeyword 2:
    url: http://www.example.com/?q={%query}&p={%puery}
    title: Custom shortcut
    description: My custom shortcut with the keyword examplekeyword and 2 arguments.
    tags:
        - example
```
