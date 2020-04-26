const gulp = require('gulp');
const typescript = require('gulp-typescript');
const plumber = require('gulp-plumber');
const merge2 = require('merge2');
const postcss = require('gulp-postcss');
const gulpif = require('gulp-if');
const autoprefixer = require('autoprefixer');
const postcssUrl = require('postcss-url');

const {isProduction, isTest, outputDir} = require('./_env');
const dr = require('./_dumber');

function buildJs(src) {
  const ts = typescript.createProject('tsconfig.json');
  const transpile = ts();

  return gulp.src(src, {sourcemaps: true, since: gulp.lastRun(build)})
  .pipe(gulpif(!isProduction && !isTest, plumber()))
  .pipe(transpile);
}

function buildCss(src) {
  return gulp.src(src, {sourcemaps: true})
  .pipe(postcss([
    autoprefixer(),
    // use postcss-url to inline any image/font/svg.
    // postcss-url by default use base64 for images, but
    // encodeURIComponent for svg which does NOT work on
    // some browsers.
    // Here we enforce base64 encoding for all assets to
    // improve compatibility on svg.
    postcssUrl({url: 'inline', encodeType: 'base64'})
  ]));
}

function build() {
  // Merge all js/css/html file streams to feed dumber.
  // Note scss was transpiled to css file by gulp-dart-sass.
  // dumber knows nothing about .ts/.less/.scss/.md files,
  // gulp-* plugins transpiled them into js/css/html before
  // sending to dumber.
  return merge2(
    gulp.src(isTest ? ['{src,dev-app}/**/*.json', 'test/**/*.json'] : '{src,dev-app}/**/*.json', {since: gulp.lastRun(build)}),
    gulp.src(isTest ? '{src,dev-app}/**/*.html' : '{src,dev-app}/**/*.html', {since: gulp.lastRun(build)}),
    buildJs(isTest ? ['{src,dev-app}/**/*.ts', 'test/**/*.ts'] : '{src,dev-app}/**/*.ts'),
    buildCss(isTest ? '{src,dev-app}/**/*.css' : '{src,dev-app}/**/*.css')
  )

  // Note we did extra call `dr()` here, this is designed to cater watch mode.
  // dumber here consumes (swallows) all incoming Vinyl files,
  // then generates new Vinyl files for all output bundle files.
  .pipe(dr())
  .pipe(gulp.dest(outputDir, {sourcemaps: isProduction ? false : (isTest ? true : '.')}));
}

module.exports = build;
module.exports.buildJs = buildJs;
module.exports.buildCss = buildCss;
