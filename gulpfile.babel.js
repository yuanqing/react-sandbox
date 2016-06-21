import del from 'del';
import opn from 'opn';
import gulp from 'gulp';
import http from 'http';
import nopt from 'nopt';
import fs from 'fs-extra';
import gutil from 'gulp-util';
import eslint from 'gulp-eslint';
import buffer from 'vinyl-buffer';
import source from 'vinyl-source-stream';
import babelify from 'babelify';
import ecstatic from 'ecstatic';
import watchify from 'watchify';
import browserify from 'browserify';
import runSequence from 'run-sequence';
import cssModulesify from 'css-modulesify';

const PORT = 8888;
const JS_VENDOR_MODULES = ['react', 'react-dom'];
const JS_APP_FILE = 'app.js';
const CSS_APP_FILE = 'app.css';
const DIST_DIR = 'dist';
const DIST_VENDOR_FILE = 'vendor.js';
const DIST_APP_FILE = 'app.js';

function bundleApp(b) {
  return b.bundle()
    .pipe(source(DIST_APP_FILE))
    .pipe(buffer())
    .pipe(gulp.dest(DIST_DIR));
};

gulp.task('lint', () => {
  return gulp.src([JS_APP_FILE, __filename])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('build', [
  'build:vendor',
  'build:app'
]);

gulp.task('build:vendor', () => {
  return browserify()
    .require(JS_VENDOR_MODULES)
    .bundle()
    .pipe(source(DIST_VENDOR_FILE))
    .pipe(buffer())
    .pipe(gulp.dest(DIST_DIR));
});

const cssModulesifyOptions = {
  rootDir: __dirname,
  output: DIST_DIR + '/' + CSS_APP_FILE
};

gulp.task('build:app', () => {
  fs.ensureDirSync(DIST_DIR);
  const b = browserify({
    entries: [JS_APP_FILE]
  });
  b.external(JS_VENDOR_MODULES);
  b.transform(babelify);
  b.plugin(cssModulesify, cssModulesifyOptions);
  return bundleApp(b);
});

gulp.task('watch', () => {
  fs.ensureDirSync(DIST_DIR);
  const b = browserify({
    entries: [JS_APP_FILE],
    debug: true,
    cache: {},
    packageCache: {}
  });
  b.external(JS_VENDOR_MODULES);
  b.transform(babelify);
  b.plugin(cssModulesify, cssModulesifyOptions);
  b.plugin(watchify);
  b.on('error', gutil.log);
  b.on('log', gutil.log);
  b.on('update', () => {
    bundleApp(b);
  });
  bundleApp(b);
});

gulp.task('clean', () => {
  return del(DIST_DIR);
});

gulp.task('serve', (callback) => {
  http.createServer(ecstatic({
    root: '.'
  })).listen(PORT, () => {
    const args = nopt({
      open: Boolean
    }, {
      o: ['--open']
    });
    if (args.open) {
      const url = 'http://localhost:' + PORT;
      gutil.log(gutil.colors.green('Opening', url));
      opn(url, {
        app: 'google chrome',
        wait: false
      }).then(() => {
        callback();
      });
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
