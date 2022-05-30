/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const loadTasks = require('load-grunt-tasks');

const {copyConfig, babelConfig} = require('./build/config');
const {cleanBuild, startRenderer} = require('./build/task');

module.exports = function (grunt) {
    loadTasks(grunt, {pattern: ['grunt-contrib-copy', 'grunt-babel']});

    grunt.initConfig({
        copy: copyConfig,
        babel: babelConfig
    });

    grunt.registerTask('clean', 'Cleans up the output files.', cleanBuild);
    grunt.registerTask('render', 'Starts the electron renderer.', startRenderer);
    grunt.registerTask('start', ['clean', 'babel', 'copy', 'render']);
};
