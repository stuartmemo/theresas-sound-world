module.exports = function (grunt) {
    'use strict';

    // Project config.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        uglify: {
            all: {
                files: {
                    'build/tsw.min.js': ['src/tsw-core.js', 'src/tsw-effects.js', 'src/tsw-music.js']
                },
                options: {
                    banner: '/* <%= pkg.title %> <%= pkg.version %> (c) 2013 Stuart Memo %> */\n'
                }
            }
        }
    });

    // Load plugins.
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // Default tasks.
    grunt.registerTask('default', ['uglify']);
};
