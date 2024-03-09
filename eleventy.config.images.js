const path = require('path');
const eleventyImage = require('@11ty/eleventy-img');

module.exports = (eleventyConfig) => {
  function relativeToInputPath(inputPath, relativeFilePath) {
    let split = inputPath.split('/');
    split.pop();

    return path.resolve(split.join(path.sep), relativeFilePath);
  }

  // Eleventy Image shortcode
  // https://www.11ty.dev/docs/plugins/image/
  eleventyConfig.addAsyncShortcode(
    'image',
    async function imageShortcode(src, alt, widths, sizes) {
      // Full list of formats here: https://www.11ty.dev/docs/plugins/image/#output-formats
      // Warning: Avif can be resource-intensive so take care!
      let formats = ['avif', 'webp', 'auto'];
      let file = relativeToInputPath(this.page.inputPath, src);
      let metadata = await eleventyImage(file, {
        widths: widths || ['auto', 300],
        formats,
        outputDir: path.join(eleventyConfig.dir.output, 'img'), // Advanced usage note: `eleventyConfig.dir` works here because we’re using addPlugin.
      });

      // TODO loading=eager and fetchpriority=high
      let imageAttributes = {
        alt,
        sizes,
        loading: 'lazy',
        decoding: 'async',
      };

      // Generate image HTML
      let imageHtml = eleventyImage.generateHTML(metadata, imageAttributes, {
        whitespaceMode: 'inline',
      });

      // Return the image wrapped in a link to the original image
      return `<a href="${src}" target="_blank" rel="noopener noreferrer">${imageHtml}</a>`;
    },
  );
};
