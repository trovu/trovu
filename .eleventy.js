const yaml = require('js-yaml');

const { DateTime } = require('luxon');
const markdownItAnchor = require('markdown-it-anchor');

const pluginRss = require('@11ty/eleventy-plugin-rss');
const pluginSyntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const pluginBundle = require('@11ty/eleventy-plugin-bundle');
const pluginNavigation = require('@11ty/eleventy-navigation');
const { EleventyHtmlBasePlugin } = require('@11ty/eleventy');

const pluginDrafts = require('./eleventy.config.drafts.js');
const pluginImages = require('./eleventy.config.images.js');

module.exports = (eleventyConfig) => {
  eleventyConfig.addDataExtension('yml', (contents) => yaml.load(contents));

  // Copy the contents of the `public` folder to the output folder
  // For example, `./public/css/` ends up in `_site/css/`
  eleventyConfig.addPassthroughCopy({
    './blog/public/': '.',
    './node_modules/prismjs/themes/prism-okaidia.css': '/css/prism-okaidia.css',
  });

  // Run Eleventy when these files change:
  // https://www.11ty.dev/docs/watch-serve/#add-your-own-watch-targets

  // Watch content images for the image pipeline.
  eleventyConfig.addWatchTarget('blog/content/**/*.{svg,webp,png,jpeg}');

  return {
    dir: {
      input: './blog/',
      output: './dist/blog',
    },
  };
};
