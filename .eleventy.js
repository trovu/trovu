const yaml = require('js-yaml');

module.exports = (eleventyConfig) => {
  eleventyConfig.addDataExtension('yml', (contents) => yaml.load(contents));
  return {
    dir: {
      input: 'blog',
      output: 'dist/blog/',
    },
  };
};
