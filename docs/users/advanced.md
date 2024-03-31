# Advanced settings & personal shortcuts

You can create and manage your own user shortcuts and set advanced settings via GitHub, or a self-hosted config file.

There is also this [tutorial video](https://www.youtube.com/watch?v=DA9GjWr4WbY).

## Set up a custom configuration

### Via GitHub (recommended)

1. If you don't have one, [create a GitHub.com account](https://github.com/signup). It is free.
1. Fork [trovu-data-user](https://github.com/trovu/trovu-data-user) into your own GitHub account.
1. In there, adjust `config.yml` to your needs, and add your own shortcuts to `shortcuts.yml`. (Both are [YAML files](https://en.wikipedia.org/wiki/YAML).)
1. Call Trovu with `https://trovu.net/?#github=YOUR_GITHUB_USERNAME`

### Via a self-hosted file

1. Put a file online matching the structure of [config.yml](https://github.com/trovu/trovu-data-user/blob/master/config.yml).
1. Call Trovu with `https://trovu.net/?#configUrl=URL_TO_YOUR_CONFIG_YML`.

Note that creating your own shortcuts won't work with `github: .`

Instead, you will need to define them within the config file, see [Namespaces](#namespaces).

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
    - url: https://example.com/shortcuts.yml
      name: mydomain
```

This is an array of the [namespaces](../shortcuts/namespaces.md) you want to use. Every entry may be either

-   a string: Then it refers to an (official) site namespace, i.e. one in the [`/data` subdirectory](https://github.com/trovu/trovu/tree/master/data/) repository. Shortcuts in there are curated by the Trovu community.
-   key/value pairs, then they refer to a user namespace, e.g. your (or someone else's) user namespace in GitHub. Read more below.

The **order** is also relevant: The later the namespace appears in the list, the higher priority it has. So in the example above, shortcuts in `mydomain` have the highest precedence.

#### User namespaces

User namespaces can look like this:

```yaml
namespaces:
    - github: .
```

This is the most common setting. It refers to the current (=your) `trovu-data-user` repo. It will look for a `shortcuts.yml`, next to this very `config.yml`.

```yaml
namespaces:
    - github: .
      name: my
```

You can also give it a custom name. Defaults to the current repo's name.

```yaml
namespaces:
    - github: johndoe
```

Will look for a repo `https://github.com/johndoe/trovu-data-user/` and use its shortcuts. Setting another `name:` is possible.

```yaml
- name: mydomain
  url: https://example.com/shortcuts.yml
```

Will take shortcuts from this URL. Make sure [CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) is enabled.

```yaml
- name: righthere
  shortcuts:
      examplekeyword 0:
          url: https://example.com/
```

Define a namespace with shortcuts just right here.

(Beware: Unlike having them in a separate `shortcuts.yml`, this approach makes it impossible for others to use them.)

### Default keyword

```yaml
defaultKeyword: g
```

If no keyword is recognized in a query, this one will be used. Useful for setting up a much used shortcut.

### Language

```yaml
language: en
```

For Wikipedia in your language (or other shortcuts using `<$language>`). Basically, it fills the `<$language>` variable in the shortcut URLs. Now, using the `w` shortcut will get you to the Wikipedia in your language, as its shortcut URL is set as `https://<$language>.wikipedia.org/`.

### Country

```yaml
country: de
```

For shortcuts that use `<$country>` in their URL. Works similarly as `<$language>`.

## Personal shortcuts

Add personal [shortcuts](../shortcuts/index.md) to `shortcuts.yml`.
