'use strict';

var browserify = require('browserify');
var del = require('del');
var gulp = require('gulp');
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

gulp.task('test', function (done) {
    new Server({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true
    }, done).start();
});

gulp.task('bundle', function () {
    return browserify('./src/tsw-main.js')
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

gulp.task('build', function () {
    runSequence('clean', 'bundle', 'uglify');
});
