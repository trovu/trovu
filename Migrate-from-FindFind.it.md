[FindFind.it](https://www.findfind.it/) will **end its service latest in October 2023**, with the [end of life of Drupal 7](https://www.drupal.org/psa-2022-02-23).

But its **successor [trovu.net](https://trovu.net/)** is already running. Trovu is a [[little different to FindFind.it / Serchilo|Differences to Serchilo and FindFind.it]].

This page helps you how to switch to Trovu.

Your migration depends on whether you used FindFind.it with or without a personal account.

## With a FindFind.it account

In this case, you can migrate your settings and user shortcuts. It should **not take longer than 5 minutes**.

You must have an account at <a href="https://github.com/">Github</a>. It is free.

1. Log into Github.
1. Open [trovu-data-user](https://github.com/trovu/trovu-data-user). 
1. Fork [trovu-data-user](https://github.com/trovu/trovu-data-user) into your account. (You find the button on the upper right.)
1. Within your newly forked repository (it should be under `https://github.com/YOUR_GITHUB_USERNAME/trovu-data-user`) , in the file list click on `config.yml` and then the 🖊 icon on the upper right to edit it.
1. In a new tab, log into your [FindFind.it](https://findfind.it) account.
1. Go to *My account* ➡️ *Edit*.
1. At the bottom, find *Export to Trovu*
1. Replace the contents in the opened `config.yml` on Github with the contents of the **config.yml** field in FindFind.it.
1. Click on *Commit changes*.
1. Do the same for `shortcuts.yml`.
1. Call Trovu with https://trovu.net/#github=YOUR_GITHUB_USERNAME
1. Read how to [[use Trovu on your device]].

## Without a FindFind.it account

In this case, read how to [[use Trovu on your device]]. Make sure that you set the correct language and country, either via the URL or the Settings.

## Read more

- [Advanced settings & personal shortcuts](https://github.com/trovu/trovu.github.io/wiki/Advanced-settings-&-personal-shortcuts)

If you have problems or questions, get [[support]].