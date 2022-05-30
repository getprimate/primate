/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const childProcess = require('node:child_process');
const path = require('path');

const electron = require('electron');
const grunt = require('grunt');
const rimraf = require('rimraf');

const {ROOT_DIR} = require('./constant');

function _onRendererExit(code) {
    grunt.log.writeln(`Electron exited with code ${code}.`);
}

/* eslint-disable no-console */
function cleanBuild() {
    const done = this.async();

    rimraf(path.join(ROOT_DIR, '{dist,release}'), {disableGlob: false}, (error) => {
        if (error) {
            grunt.log.errorlns([`Could not clean-up: ${error}`]);
            return false;
        }

        grunt.log.errorlns(['Removed output directories.']);
        done();

        return true;
    });
}

/* eslint-disable no-console */
function startRenderer() {
    const child = childProcess.spawn(electron, [ROOT_DIR, '--trace-warnings'], {
        stdio: ['pipe', process.stdout, process.stderr]
    });

    child.on('close', _onRendererExit);
    child.on('exit', _onRendererExit);
    child.on('SIGTERM', _onRendererExit);
}

module.exports = {
    cleanBuild,
    startRenderer
};
