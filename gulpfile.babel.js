import del from 'del';
import opn from 'opn';
import gulp from 'gulp';
import http from 'http';
import nopt from 'nopt';
import gutil from 'gulp-util';
import eslint from 'gulp-eslint';
import buffer from 'vinyl-buffer';
import source from 'vinyl-source-stream';
import babelify from 'babelify';
import ecstatic from 'ecstatic';
import watchify from 'watchify';
import browserify from 'browserify';
import runSequence from 'run-sequence';

const PORT = 8888;
const JS_VENDOR_MODULES = ['react', 'react-dom'];
const JS_APP_FILE = 'app.js';
const DIST_DIR = 'dist';
const DIST_VENDOR_FILE = 'vendor.js';
const DIST_APP_FILE = 'app.js';

const args = nopt({
  open: String
}, {
  o: ['--open', 'google chrome']
});

const babelifyOptions = {
  presets: ['es2015', 'react']
};

function bundleApp(b) {
  return b.bundle()
    .pipe(source(DIST_APP_FILE))
    .pipe(buffer())
    .pipe(gulp.dest(DIST_DIR));
};

gulp.task('clean', () => {
  return del(DIST_DIR);
});

gulp.task('lint', () => {
  return gulp.src(['app.js', __filename])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('build', ['build:vendor', 'build:app']);

gulp.task('build:vendor', () => {
  return browserify()
    .require(JS_VENDOR_MODULES)
    .bundle()
    .pipe(source(DIST_VENDOR_FILE))
    .pipe(buffer())
    .pipe(gulp.dest(DIST_DIR));
});

gulp.task('build:app', () => {
  const b = browserify({
    entries: [JS_APP_FILE]
  });
  b.external(JS_VENDOR_MODULES);
  b.transform(babelify, {
    presets: ['es2015', 'react']
  });
  return bundleApp(b);
});

gulp.task('watch', () => {
  const b = browserify({
    entries: [JS_APP_FILE],
    debug: true,
    cache: {},
    packageCache: {}
  });
  b.external(JS_VENDOR_MODULES);
  b.transform(babelify, babelifyOptions);
  b.plugin(watchify);
  b.on('error', gutil.log);
  b.on('log', gutil.log);
  b.on('update', () => {
    bundleApp(b);
  });
  bundleApp(b);
});

gulp.task('serve', (callback) => {
  http.createServer(ecstatic({
    root: '.'
  })).listen(PORT, () => {
    if (args.open) {
      const url = 'http://localhost:' + PORT;
      gutil.log(gutil.colors.green('Opening', url));
      opn(url, {
        app: args.open,
        wait: false
      }, callback);
    }
  });
});

gulp.task('default', () => {
  runSequence(
    'clean',
    'lint',
    'build',
    'watch',
    'serve'
  );
});
