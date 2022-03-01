'use strict';

const childProcess = require('child_process');
const path = require('path');
const electron = require('electron');

const ROOT_DIR = path.dirname(__dirname);

/* eslint-disable no-console */
function startRenderer() {
    const child = childProcess.spawn(electron, [ROOT_DIR, '--trace-warnings'], {
        stdio: 'pipe'
    });

    child.on('exit', (code) => {
        console.log('Child exited with code: ' + code);
    });
}

module.exports = {startRenderer};
