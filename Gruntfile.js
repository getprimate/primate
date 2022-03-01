'use strict';

const {startRenderer} = require('./tasks/start');

module.exports = function (grunt) {
    grunt.registerTask('start', 'Starts the application', startRenderer);
};
