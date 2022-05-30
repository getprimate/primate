/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const childProcess = require('node:child_process');
const path = require('path');

const grunt = require('grunt');
const rimraf = require('rimraf');

const electron = require('electron');
const {build, Platform} = require('electron-builder');

const {ROOT_DIR} = require('./constant');
const {releaseConfig} = require('./builder-config');

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

        grunt.log.oklns(['Cleaned up output directories.']);
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

function makeRelease(platform, type) {
    const done = this.async();

    let config = releaseConfig;
    let targets = Platform.WINDOWS.createTarget();

    switch (platform) {
        case 'linux':
            targets = Platform.LINUX.createTarget();
            break;

        case 'macos':
            targets = Platform.MAC.createTarget();
            break;

        default:
            break;
    }

    const builder = build({config, targets});

    grunt.log.writeln(`Release platform: ${platform}, Type: ${type}.`);

    builder.then((result) => {
        grunt.log.oklns(['Binaries written to release/ directory.']);
    });

    builder.catch((error) => {
        grunt.log.errorlns([`${error}`]);
    });

    builder.finally(() => {
        done();
    });
}

module.exports = {
    cleanBuild,
    startRenderer,
    makeRelease
};
