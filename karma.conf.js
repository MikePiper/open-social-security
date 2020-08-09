// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

// to use Chromium browser in Ubuntu 18.04, in the VSCode terminal,
// (before calling ng test)
// export CHROME_BIN='/snap/bin/chromium'

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-firefox-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage-istanbul-reporter'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client:{
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    coverageIstanbulReporter: {
      dir: require('path').join(__dirname, 'coverage'), reports: [ 'html', 'lcovonly' ],
      fixWebpackSourcePaths: true
    },
    angularCli: {
      environment: 'dev'
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false, // with the original karma.conf.js, was doing multiple runs in random order, but the tests kept restarting on my computer (when "disconnected"?)
    // singleRun: true, // so I added these two lines
    // random: false, // still doesn't run all tests
    browserNoActivityTimeout : 60000//by default 10000
  });
};
