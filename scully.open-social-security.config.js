exports.config = {
  projectRoot: "./src",
  projectName: "open-social-security",
  outDir: './dist/static',
  defaultPostRenderers: ['seoHrefOptimise'],
  routes: {
    '/articles/:slug': {
      type: 'contentFolder',
      slug: {
        folder: "./articlesmarkdown"
      }
    },
  }
};