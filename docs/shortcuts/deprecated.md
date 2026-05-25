# shortcut.deprecated

Let's assume a shortcut keyword has been renamed. We want to inform users about the change when they use the old keyword. This is how it is done:

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

In `query:`, make sure to only use placeholders like `<1>`, `<2>`. They will be filled with the user's arguments in their order.

If the user now calls a query e.g. `oldkeyword foo`, a status message about the deprecation will be shown, and the input field will be prefilled with the correct query. So the user only needs to click the submit button to proceed.

The `created:` attribute is informational only. We can use it later if we want to reuse `oldkeyword` (e.g. for another shortcut) and need to check whether enough time has already passed.
