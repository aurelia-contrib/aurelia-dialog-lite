const gulp = require('gulp');
const gulpif = require('gulp-if');
const gulpSourcemaps = require('gulp-sourcemaps');
const {buildJs, buildCss} = require('./build');
const terser = require('gulp-terser');
const {isProduction, pluginOutputDir} = require('./_env');

function buildPlugin() {
  return buildJs('src/**/*.ts')
    // Terser fast minify mode
    // https://github.com/terser-js/terser#terser-fast-minify-mode
    // It's a good balance on size and speed to turn off compress.
    .pipe(gulpif(f => f.extname === '.js' && isProduction, terser({compress: false})))
    // Use gulp-sourcemaps instead of default gulp v4
    // to bypass a gulp issue.
    // https://github.com/gulpjs/gulp/issues/2288#issuecomment-506953894
    .pipe(gulpSourcemaps.write('.', {
      includeContent: true,
      sourceRoot: '../src/'
    }))
    .pipe(gulp.dest(pluginOutputDir));
}

module.exports = buildPlugin;

