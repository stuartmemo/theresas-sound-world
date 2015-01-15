module.exports = function (grunt) {
    'use strict';

    // Project config.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        uglify: {
            all: {
                files: {
                    'dist/tsw.min.js': ['src/tsw-core.js', 'src/tsw-effects.js', 'src/tsw-music.js', 'src/tsw-midi.js', 'src/tsw-analysis.js']
                }
            },
            options: {
                banner: '/*! <%= pkg.title %> - v<%= pkg.version %> - (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %> */'
            }
        },

        karma: {
            unit: {
                configFile: 'karma-conf.js'
            }
        },

        concat: {
            dist: {
                src: ['src/tsw-core.js', 'src/tsw-effects.js', 'src/tsw-music.js', 'src/tsw-midi.js', 'src/tsw-analysis.js', 'src/tsw-loop.js'],
                dest: 'dist/tsw.js'
            }
        },

        watch: {
            files: ['src/*.js'],
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
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-karma');

    // Default tasks.
    grunt.registerTask('default', ['watch']);
    grunt.registerTask('build', ['concat', 'uglify']);
    grunt.registerTask('server', ['connect', 'watch']);
    grunt.registerTask('test', ['karma']);
};
