'use strict';

const loadGruntTasks = require('load-grunt-tasks');

const {startRenderer, cleanBuild, makeRelease} = require('./build/task');
const {copyConfig, babelConfig} = require('./build/config');

module.exports = function (grunt) {
    loadGruntTasks(grunt, {pattern: ['grunt-contrib-copy', 'grunt-babel']});

    grunt.initConfig({
        copy: copyConfig,
        babel: babelConfig
    });

    grunt.registerTask('clean', 'Cleans up the build directory.', cleanBuild);
    grunt.registerTask('pack', 'Packages the application.', makeRelease);

    grunt.registerTask('compile', ['clean', 'babel', 'copy']);
    grunt.registerTask('start', 'Starts the application', startRenderer);
    grunt.registerTask('release', ['compile', 'pack']);
};
