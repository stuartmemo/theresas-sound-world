'use strict';

var browserify = require('browserify');
var del = require('del');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var Server = require('karma').Server;

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

gulp.task('build', ['clean'], function () {
    return browserify('./src/tsw-main.js')
        .bundle()
        .pipe(source('tsw.js'))
        .pipe(gulp.dest('./dist'));
});
