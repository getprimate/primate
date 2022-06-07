/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const childProcess = require('node:child_process');
const electron = require('electron');
const {ROOT_DIR} = require('../build/constant.js');

const child = childProcess.spawn(electron, [ROOT_DIR, '--trace-warnings'], {
    stdio: ['pipe', process.stdout, process.stderr]
});

child.on('close', (code) => {
    console.log('Close event triggered ', code);
});

child.on('exit', (code) => {
    console.log('Exit event triggered ', code);
});
