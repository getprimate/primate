/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const os = require('node:os');
const {app, dialog} = require('electron');

const extended = {
    Version: app.getVersion(),
    Electron: process.versions.electron,
    Date: 'September 10, 2023',
    Platform: os.release()
};

function buildDetails(details) {
    const keys = Object.keys(details);
    const list = [];

    for (let key of keys) {
        list.push(`${key}: ${details[key]}`);
    }

    return list.join('\n');
}

/**
 * @type {Electron.MessageBoxOptions}
 */
const options = {
    title: 'Primate',
    message: 'About Primate',
    type: 'info',
    detail: buildDetails(extended)
};

function showAboutDialog(window) {
    dialog.showMessageBox(window, options).finally(() => {});
}

module.exports = {showAboutDialog};
