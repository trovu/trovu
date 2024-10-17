# General

## Prerequisites

-   NodeJS >= 18 and <= 21.3
-   NPM >= 10

## Configuration

You can override the [default configuration](https://github.com/trovu/trovu/blob/master/trovu.config.default.yml) in `trovu.config.default.yml` by placing a `trovu.config.yml` next to it, and overriding the values you want to set differently for your instance.

For example, if your local Trovu shall have additional (or different) shortcuts available by default, you can create a new [namespace](../shortcuts/namespaces.md) file `/data/shortcuts/foo.yml`, and then set `trovu.config.yml` to

```yaml
namespaces:
    - o
    - <$language>
    - .<$country>
    - foo
```

Also, if you don't want to build the `/docs` and the `/blog`, and instead link to the ones on trovu.net, adjust the URLs to:

```yaml
url:
    blog: https://trovu.net/blog/
    docs: https://trovu.net/docs/
```

## Installation

For the minimal installation, run:

```bash
git clone https://github.com/trovu/trovu.git
cd trovu
npm clean-install      # Install dependencies
npm run build          # Build the website including data
npm run dev-server     # Run the local development server
```

For building more, like the blog and the docs, have a look on the [GitHub workflow](https://github.com/trovu/trovu/blob/master/.github/workflows/deploy.yml).

Now, open the displayed URL of the local server in your browser. You should see the Trovu website.

### Add custom shortcuts

If you want to add custom shortcuts to your local installation (that shall be available as [site namespaces](../shortcuts/namespaces.md)), simply put one (or more) YAML files into [/data/shortcuts/](https://github.com/trovu/trovu/tree/master/data/shortcuts). Then, run `npm run build` again.

## Use Local Installation

If you prefer a local installation over the use of the public version [trovu.net](https://trovu.net/), you can [set your local Trovu version as your default search engine](../users/integration.md) (just use your web server's domain or your localhost as its domain).

## Code documentation

An auto-created documentation of the code by [JSDoc](https://jsdoc.app/) is also [available](code/).
