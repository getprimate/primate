'use strict';

const childProcess = require('child_process');
const path = require('path');
const electron = require('electron');
const rimraf = require('rimraf');
const {build, Platform} = require('electron-builder');

const {ROOT_DIR} = require('./constant');
const {releaseConfig} = require('./config');

/* eslint-disable no-console */
function startRenderer() {
    const child = childProcess.spawn(electron, [ROOT_DIR, '--trace-warnings'], {
        stdio: 'pipe'
    });

    child.on('exit', (code) => {
        console.log('Child exited with code: ' + code);
    });
}

/* eslint-disable no-console */
function cleanBuild() {
    const done = this.async();

    rimraf(path.join(ROOT_DIR, '{dist,release}'), {disableGlob: false}, (error) => {
        if (error) {
            console.error(`${error}`);
            return false;
        }

        console.log('Removed dist and release directories.');

        done();
        return true;
    });
}

function makeRelease() {
    const done = this.async();
    const config = releaseConfig;

    const builder = build({
        targets: Platform.LINUX.createTarget(),
        config
    });

    builder.then((result) => {
        console.log(JSON.stringify(result, null, 4));
    });

    builder.catch((error) => {
        console.error(JSON.stringify(error, null, 4));
    });

    builder.finally(() => {
        done();
    });
}

module.exports = {startRenderer, cleanBuild, makeRelease};
