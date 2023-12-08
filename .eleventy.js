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
  return {
    dir: {
      input: 'blog',
      output: 'dist/blog/',
    },
  };
};
