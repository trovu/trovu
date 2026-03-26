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
    async function imageShortcode(
      src,
      alt,
      widths = ['auto'],
      sizes = [],
      url = false,
    ) {
      // Full list of formats here: https://www.11ty.dev/docs/plugins/image/#output-formats
      // Warning: Avif can be resource-intensive so take care!
      let formats = ['avif', 'webp', 'auto'];
      let file = relativeToInputPath(this.page.inputPath, src);
      let metadata = await eleventyImage(file, {
        widths,
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

      const original = metadata.jpeg[metadata.jpeg.length - 1];

      console.log('Image URL:', url);
      if (!url) {
        url = original.url;
      }
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${imageHtml}</a>`;
    },
  );

  // Eleventy Image shortcode for full-width images
  eleventyConfig.addAsyncShortcode(
    'imageFull',
    async function imageFullShortcode(src, alt) {
      if (!src || !alt) {
        throw new Error(
          "Image shortcode requires both 'src' and 'alt' parameters.",
        );
      }

      // Commonly used image widths for responsive design
      let widths = [320, 480, 768, 1024, 1280, 1600, 1920];
      let formats = ['jpeg', 'webp']; // Specify the formats as jpeg and webp

      // Resolve the relative path
      let file = relativeToInputPath(this.page.inputPath, src);

      // Use Eleventy Image to generate the images
      let metadata = await eleventyImage(file, {
        widths,
        formats,
        outputDir: path.join(eleventyConfig.dir.output, 'img'), // Output directory for generated images
      });

      // Image attributes
      let imageAttributes = {
        alt,
        sizes: '100vw', // Full width of the viewport
        loading: 'lazy',
        decoding: 'async',
        class: 'full-width',
      };

      // Generate the HTML for the image
      let imageHtml = eleventyImage.generateHTML(metadata, imageAttributes, {
        whitespaceMode: 'inline',
      });

      // Return the generated HTML
      return `<div>${imageHtml}</div>`;
    },
  );
};
