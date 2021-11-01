You can create and manage your own user shortcuts and set advanced settings:

1. Fork [trovu-data-user](https://github.com/trovu/trovu-data-user) into your own Github account.
2. Adjust [config.yml](config.yml) to your needs, and add your own shortcuts (read more below).
3. Call Trovu with https://trovu.net/#github=YOUR_GITHUB_USERNAME 


## Custom configuration

You may adjust [config.yml](https://github.com/trovu/trovu-data-user/blob/master/config.yml) to your needs. It uses the [YAML format](https://en.wikipedia.org/wiki/YAML).

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

- a string: Then it refers to an (official) site namespace, i.e. one in the [trovu-data](https://github.com/trovu/trovu-data) repository. Shortcuts in there are curated by the Trovu community.
- key/value pairs, then they refer to a custom namespace, e.g. your (or someone else's) user namespace in Github. Every entry must contain:
  - `github:` A Github user name, or a dot
  - (optional) `name:` Some custom name (default: value from `github:`)

The dot will refer to the __current GitHub user__ (where this `config.yml` is located).

The __order__ is also relevant: The later the namespace appears in the list, the higher priority it has. So in the example above, shortcuts in `my` have highest precedence. 

### Default keyword

```yaml
defaultKeyword: g 
```
If no keyword is recognized in a query, this one will be used. Useful for setting up a much used shortcut.

### Language

```yaml
language: en
```
For Wikipedia or dictionaries in your language. Basically, it fills the `{$language}` variable in the shortcut URLs. Now, using the `w` shortcut will get you to the Wikipedia in your language, as its shortcut URL is set as `https://{$language}.wikipedia.org/`. 

Note: Other language related shortcuts like dictionaries are usually in their language namespace. Make sure to add e.g. `- de` to your namespaces in case you want to use German-related dictionaries.

### Country

```yaml
country: de
```

For shortcuts that use `{$country}` in their URL. Works similarly as `{$language}`.

## Adding shortcuts

To add personal shortcuts, follow the examples in [shortcuts.yml](https://github.com/trovu/trovu-data-user/blob/master/shortcuts.yml).