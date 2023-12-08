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

  // App plugins
  eleventyConfig.addPlugin(pluginDrafts);
  eleventyConfig.addPlugin(pluginImages);

  return {
    // Control which files Eleventy will process
    // e.g.: *.md, *.njk, *.html, *.liquid
    templateFormats: ['md', 'njk', 'html', 'liquid'],

    // Pre-process *.md files with: (default: `liquid`)
    markdownTemplateEngine: 'njk',

    // Pre-process *.html files with: (default: `liquid`)
    htmlTemplateEngine: 'njk',

    // These are all optional:
    dir: {
      input: './blog', // default: "."
      includes: '../_includes', // default: "_includes"
      data: '../_data', // default: "_data"
      output: './dist/blog',
    },

    // -----------------------------------------------------------------
    // Optional items:
    // -----------------------------------------------------------------

    // If your site deploys to a subdirectory, change `pathPrefix`.
    // Read more: https://www.11ty.dev/docs/config/#deploy-to-a-subdirectory-with-a-path-prefix

    // When paired with the HTML <base> plugin https://www.11ty.dev/docs/plugins/html-base/
    // it will transform any absolute URLs in your HTML to include this
    // folder name and does **not** affect where things go in the output folder.
    pathPrefix: '/',
  };
};
