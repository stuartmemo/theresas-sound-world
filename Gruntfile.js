module.exports = function (grunt) {
    'use strict';

    // Project config.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        uglify: {
            all: {
                files: {
                    'build/tsw.min.js': ['src/tsw-core.js', 'src/tsw-effects.js', 'src/tsw-music.js', 'src/tsw-midi.js']
                }
            }
        },

        concat: {
            dist: {
                src: ['src/tsw-core.js', 'src/tsw-effects.js', 'src/tsw-music.js', 'src/tsw-midi.js'],
                dest: 'build/tsw.js'
            }
        },

        watch: {
            files: ['src/tsw-core.js', 'src/tsw-effects.js', 'src/tsw-music.js', 'src/tsw-midi.js'],
            tasks: ['concat', 'uglify']
        },

        connect: {
            server: {
                options: {
                    port: 9000
                }
            }
        }
    });

    // Load plugins.
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');

    // Default tasks.
    grunt.registerTask('default', ['watch']);
    grunt.registerTask('build', ['concat', 'uglify']);
    grunt.registerTask('server', ['connect', 'watch']);
};
