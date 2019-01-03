var browserify = require('browserify');
var connect = require('gulp-connect');
var del = require('del');
var gulp = require('gulp');
var header = require('gulp-header');
var pkg = require('./package.json');
var rename = require('gulp-rename');
var runSequence = require('run-sequence');
var source = require('vinyl-source-stream');
var Server = require('karma').Server;
var uglify = require('gulp-uglify');

// Clean
gulp.task('clean', function (done) {
    del(['./dist']).then(function () {
        done();
    });
});

gulp.task('serve', function () {
    connect.server();
});

gulp.task('test', function (done) {
    Server.start({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true
    }, function () {
        done();
    });
});

gulp.task('bundle', function () {
    return browserify('./src/tsw-browser.js')
        .bundle()
        .pipe(source('tsw.js'))
        .pipe(gulp.dest('./dist'));
});

gulp.task('uglify', function () {
    return gulp.src('./dist/tsw.js')
        .pipe(uglify())
        .pipe(rename('tsw.min.js'))
        .pipe(gulp.dest('./dist'));
});

gulp.task('add-banner', function () {
    var banner = [
        '/**',
        ' * @name <%= pkg.title %>',
        ' * @description <%= pkg.description %>',
        ' * @version v<%= pkg.version %>',
        ' * @tutorial <%= pkg.homepage %>',
        ' * @author <%= pkg.author.name %>',
        ' * @license <%= pkg.license %>',
        ' */',
        ''
    ].join('\n');

    return gulp.src('./dist/tsw.*')
        .pipe(header(banner, { pkg: pkg }))
        .pipe(gulp.dest('./dist'));
});

gulp.task('build', gulp.series('clean', 'bundle', 'uglify', 'add-banner'));
gulp.task('build-and-test', gulp.series('build', 'test'));
