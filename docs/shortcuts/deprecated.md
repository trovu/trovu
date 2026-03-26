# shortcut.deprecated

Let's assume a keyword of a shortcut has be renamed. We want to inform the users about the change when the use the old keyword. This is how it is done:

```yaml
oldkeyword 1:
    deprecated:
        alternative:
            query: newkeyword <1>
        created: '2023-01-01'
newkeyword 1:
    url: http://www.example.com/?q=<query>
    # ... and other attributes
```

If the user now calls a query e.g. `oldkeyword foo`, a status message about the deprecation will be shown, and the input field will be prefilled with the correct query. So the user only needs to click the submit button to proceed.

The `created:` attribute is only an information. We can use it if at some later point, we want to use `oldkeyword` again (e.g. for another shortcut), and check, if enough time has passed already.
