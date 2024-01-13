---
title: New: User settings via URL
description: How to be updated with this blog.
date: 2024-01-14
tags:
  - config
---

Until now, to use Trovu with advanced settings and personal shortcuts, you needed a Github account. Now, you can access these features with a self-hosted file.

For guidance on what to do, please follow the instructions in the [docs](https://trovu.net/docs/users/advanced/#via-a-self-hosted-file).

Currently, you create a file using the `config.yml` syntax. The new feature allows you to create shortcuts directly in the config file:

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
This could be a public URL, within an intranet, or on your localhost.

Then, open Trovu with `https://trovu.net/?#configUrl=URL_TO_YOUR_CONFIG_FILE`.
