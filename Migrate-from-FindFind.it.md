[FindFind.it](https://www.findfind.it/) will **end its service latest in October 2023**, with the [end of life of Drupal 7](https://www.drupal.org/psa-2022-02-23).

But its **successor [trovu.net](https://trovu.net/)** is already running. You can migrate your settings and user shortcuts. This page tells you how. 

You must have an account at <a href="https://github.com/">Github</a>. It is free.
 
1. Fork [trovu-data-user](https://github.com/trovu/trovu-data-user) into your account. (You find the button on the upper right.)
1. Within your newly forked account, open `config.yml` for editing. (Its the 🖊 icon on the upper right.)
1. Log into your [FindFind.it](https://findfind.it) account.
1. Go to *My account* ➡️ *Edit*.
1. At the bottom, find *Export to Trovu*
1. Copy the contents of **config.yml** field into the opened `config.yml` on Github.
1. Click on *Commit changes*.
1. Do the same for `shortcuts.yml`.
1. Call Trovu with https://trovu.net/#github=YOUR_GITHUB_USERNAME
1. Read how to [[use Trovu on your device]].

Read more: [Advanced settings & personal shortcuts](https://github.com/trovu/trovu.github.io/wiki/Advanced-settings-&-personal-shortcuts)

If you have problems or questions, get [[support]].