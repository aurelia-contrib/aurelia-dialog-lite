const gulp = require('gulp');
const server = require('./_dev-server');
const clean = require('./clean');
const build = require('./build');

// Use browserSync as dev server
const serve = gulp.series(
  build,
  function startServer(done) {
    server.run({open: !process.env.CI});
    done();
  }
)

// Reload browserSync
function reload(done) {
  console.log('Refreshing the browser');
  server.reload();
  done();
}

// Watch all files for rebuild and reload browserSync.
function watch() {
  return gulp.watch('{src,dev-app}/**/*', gulp.series(build, reload));
}

module.exports = gulp.series(
  clean,
  serve,
  watch
);
