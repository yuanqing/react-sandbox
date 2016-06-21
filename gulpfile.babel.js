import babelify from 'babelify';
import browserify from 'browserify';
import cssModulesify from 'css-modulesify';
import del from 'del';
import ecstatic from 'ecstatic';
import {ensureDirSync} from 'fs-extra';
import {createServer} from 'http';
import gulp, {dest, src} from 'gulp';
import eslint from 'gulp-eslint';
import {log, colors} from 'gulp-util';
import nopt from 'nopt';
import opn from 'opn';
import runSequence from 'run-sequence';
import buffer from 'vinyl-buffer';
import source from 'vinyl-source-stream';
import watchify from 'watchify';

const PORT = 8888;
const JS_VENDOR_MODULES = ['react', 'react-dom'];
const JS_APP_FILE = 'app.js';
const CSS_APP_FILE = 'app.css';
const DIST_DIR = 'dist';
const DIST_VENDOR_FILE = 'vendor.js';
const DIST_APP_FILE = 'app.js';

function bundleApp(b) {
  return b.bundle()
    .on('error', ({message, codeFrame}) => {
      log(colors.red(message));
      console.log(codeFrame);
    })
    .pipe(source(DIST_APP_FILE))
    .pipe(buffer())
    .pipe(dest(DIST_DIR));
};

gulp.task('lint', () => {
  return src([JS_APP_FILE, __filename])
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
    .pipe(dest(DIST_DIR));
});

const cssModulesifyOptions = {
  rootDir: __dirname,
  output: DIST_DIR + '/' + CSS_APP_FILE
};

gulp.task('build:app', () => {
  ensureDirSync(DIST_DIR);
  const b = browserify({
    entries: [JS_APP_FILE]
  });
  b.external(JS_VENDOR_MODULES);
  b.transform(babelify);
  b.plugin(cssModulesify, cssModulesifyOptions);
  return bundleApp(b);
});

gulp.task('watch', () => {
  ensureDirSync(DIST_DIR);
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
  b.on('error', log);
  b.on('log', log);
  b.on('update', () => {
    bundleApp(b);
  });
  bundleApp(b);
});

gulp.task('clean', () => {
  return del(DIST_DIR);
});

gulp.task('serve', (callback) => {
  createServer(ecstatic({
    root: '.'
  })).listen(PORT, () => {
    const args = nopt({
      open: Boolean
    }, {
      o: ['--open']
    });
    if (args.open) {
      const url = 'http://localhost:' + PORT;
      log(colors.green('Opening', url));
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
