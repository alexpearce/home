const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const markdownItFootnote = require("markdown-it-footnote");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const xmlFiltersPlugin = require("eleventy-xml-plugin");

module.exports = function (eleventyConfig) {
  // Add header anchor and footnotes plugin to Markdown renderer
  const markdownLib = markdownIt({html: true, typographer: true});
  const anchorOpts = {permalink: true, permalinkSymbol: "🔗"};
  markdownLib.use(markdownItFootnote).use(markdownItAnchor, anchorOpts);
  eleventyConfig.setLibrary("md", markdownLib);

  // Enable syntax highlighting
  eleventyConfig.addPlugin(syntaxHighlight);

  // Enable filters useful for XML output
  eleventyConfig.addPlugin(xmlFiltersPlugin);

  // Copy anything in the assets/ folder verbatim
  eleventyConfig.addPassthroughCopy("assets");

  // Define a posts collection for all blog posts
  eleventyConfig.addCollection("posts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("_posts/**/*.md");
  });

  // Define a post_url Liquid tag for cross referencing
  // https://rusingh.com/articles/2020/04/24/implement-jekyll-post-url-tag-11ty-shortcode/
  eleventyConfig.addShortcode("post_url", (collection, slug) => {
    try {
      if (collection.length < 1) {
        throw "Collection appears to be empty";
      }
      if (!Array.isArray(collection)) {
        throw "Collection is an invalid type - it must be an array!";
      }
      if (typeof slug !== "string") {
        throw "Slug is an invalid type - it must be a string!";
      }

      const found = collection.find(p => p.fileSlug == slug);
      if (found === 0 || found === undefined) {
        throw `${slug} not found in specified collection.`;
      } else {
        return found.url;
      }
    } catch (e) {
      console.error(
        `An error occured while searching for the url to ${slug}. Details:`,
        e
      );
    }
  });

  return {
    dir: {
      layouts: "_layouts"
    }
  }
};
