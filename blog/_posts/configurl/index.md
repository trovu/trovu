---
title: 'New: User Settings via Self-Hosted File'
description: … which can be private.
date: 2024-01-14
tags:
    - config
---

Until now, to use Trovu with advanced settings and personal shortcuts, you needed a Github account.
Now, these features are accessible [with a self-hosted file](https://trovu.net/docs/users/advanced/#via-a-self-hosted-file), which can remain private if hosted under a non-public URL.

To do this, create a file following the `config.yml` syntax. The new feature allows you to create shortcuts directly within the config file:

```yml
language: en
country: us
namespaces:
    - o
    - en
    - .us
    - name: my
      shortcuts:
          examplekeyword 0:
              url: https://example.com/
          examplekeyword 1:
              url: https://example.com/?q=<param1>
```

Host this file anywhere your browser can access it.
This could be a public URL, within an intranet, or on your `localhost`.

Then, open Trovu with `https://trovu.net/?#configUrl=URL_TO_YOUR_CONFIG_FILE`.
