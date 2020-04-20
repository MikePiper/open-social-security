exports.config = {
  projectRoot: "./src",
  projectName: "open-social-security",
  outDir: './dist/static',
  routes: {
    '/articles/:slug': {
      type: 'contentFolder',
      slug: {
        folder: "./articlesmarkdown"
      }
    },
  }
};