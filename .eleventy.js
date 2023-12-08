const yaml = require('js-yaml');

module.exports = (eleventyConfig) => {
  eleventyConfig.addDataExtension('yml', (contents) => yaml.load(contents));
};
