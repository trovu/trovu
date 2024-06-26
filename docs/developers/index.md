# General

## Prerequisites

-   NodeJS >= 18 and <= 21.3
-   NPM >= 10

## Installation

```bash
git clone https://github.com/trovu/trovu.git
cd trovu
npm clean-install      # Install dependencies
npm run build          # Build the website including data
npm run serve          # Run the local server
```

Now, open the displayed URL of the local server in your browser. You should see the Trovu website.

### Add custom shortcuts

If you want to add custom shortcuts to your local installation (that shall be available as [site namespaces](../shortcuts/namespaces.md)), simply put one (or more) YAML files into [/data/shortcuts/](https://github.com/trovu/trovu/tree/master/data/shortcuts). Then, run `npm run build` again.

## Use Local Installation

If you prefer a local installation over the use of the public version [trovu.net](https://trovu.net/), you can [set your local Trovu version as your default search engine](../users/integration.md) (just use your web server's domain or your localhost as its domain).

## Code documentation

An auto-created documentation of the code by [JSDoc](https://jsdoc.app/) is also [available](code/).
