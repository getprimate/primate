'use strict';

const loadGruntTasks = require('load-grunt-tasks');

const {cleanBuild} = require('./tasks/clean');
const {startRenderer} = require('./tasks/start');
const {makeRelease} = require('./tasks/release');

const copyConfig = require('./tasks/config/copy');
const compilerConfig = require('./tasks/config/compiler');

module.exports = function (grunt) {
    loadGruntTasks(grunt, {pattern: ['grunt-contrib-copy', 'grunt-babel']});

    grunt.initConfig({
        copy: copyConfig,
        babel: compilerConfig
    });

    grunt.registerTask('clean', 'Cleans up the build directory.', cleanBuild);
    grunt.registerTask('pack', 'Packages the application.', makeRelease);

    grunt.registerTask('compile', ['clean', 'babel', 'copy']);
    grunt.registerTask('start', 'Starts the application', startRenderer);
    grunt.registerTask('release', ['compile', 'pack']);
};
