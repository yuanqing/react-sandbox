'use strict';

var opn = require('opn');
var gulp = require('gulp');
var http = require('http');
var nopt = require('nopt');
var gutil = require('gulp-util');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');
var babelify = require('babelify');
var ecstatic = require('ecstatic');
var watchify = require('watchify');
var browserify = require('browserify');

var PORT = 8888;
var JS_VENDOR_MODULES = ['react', 'react-dom'];
var JS_APP_FILE = 'app.js';
var DIST_DIR = 'dist';
var DIST_VENDOR_FILE = 'vendor.js'
var DIST_APP_FILE = 'app.js'

var args = nopt({
  open: String
}, {
  // `gulp -o` becomes `gulp --open 'google chrome'`.
  o: ['--open', 'google chrome']
});

var browserifyOptions = {
  entries: [JS_APP_FILE],
  debug: true,
};
var b = watchify(browserify(browserifyOptions));
b.external(JS_VENDOR_MODULES);
b.transform(babelify);

var bundle = function() {
  return b.bundle()
    .pipe(source(DIST_APP_FILE))
    .pipe(buffer())
    .pipe(gulp.dest(DIST_DIR));
};

gulp.task('vendor', function() {
  return browserify()
    .require(JS_VENDOR_MODULES)
    .bundle()
    .pipe(source(DIST_VENDOR_FILE))
    .pipe(buffer())
    .pipe(gulp.dest(DIST_DIR));
});

gulp.task('watch', ['vendor'], function() {
  b.on('update', bundle);
  b.on('log', gutil.log);
  return bundle();
});

gulp.task('default', ['watch'], function() {
  http.createServer(ecstatic({
    root: '.'
  })).listen(PORT);
  if (args.open) {
    var url = 'http://localhost:' + PORT;
    gutil.log(gutil.colors.green('Opening', url));
    opn(url, {
      app: args.open,
      wait: false
    });
  }
});
