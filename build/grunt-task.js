/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const electron = require('electron');
const grunt = require('grunt');
const rimraf = require('rimraf');

const {ROOT_DIR} = require('./constant');
const {buildRelease} = require('./builder-wrapper');

/* eslint-disable no-console */
function cleanBuild() {
    const done = this.async();

    rimraf(path.join(ROOT_DIR, '{out,dist}'), {disableGlob: false}, (error) => {
        if (error) {
            grunt.log.errorlns([`Could not clean-up: ${error}`]);
            return false;
        }

        grunt.log.oklns(['Cleaned up output directories.']);
        done();

        return true;
    });
}

/* eslint-disable no-console */
function startRenderer() {
    const done = this.async();

    const child = childProcess.spawn(electron, [ROOT_DIR, '--trace-warnings'], {
        stdio: ['pipe', process.stdout, process.stderr]
    });

    child.on('close', (code) => {
        grunt.log.writeln(`Renderer exited with code ${code}.`);
        done();
    });
}

function makeRelease() {
    if (!fs.existsSync(path.join(ROOT_DIR, 'out', 'platform', 'main.js'))) {
        grunt.fail.fatal('Project not compiled yet! Run `yarn run compile` first.', 0);
        return 0;
    }

    const done = this.async();
    const release = buildRelease();

    release.then((path) => {
        grunt.log.oklns([`Created release: ${path}`]);
    });

    release.catch((error) => {
        grunt.log.errorlns([`Unable to make release: ${error}`]);
    });

    release.finally(done);
}

module.exports = {
    cleanBuild,
    startRenderer,
    makeRelease
};
