exports.config = {
  projectRoot: "./src",
  projectName: "open-social-security",
  outDir: './dist/static',
  routes: {
    '/articles/:title': {
      type: 'contentFolder',
      title: {
        folder: "./articlesmarkdown"
      }
    },
  }
};