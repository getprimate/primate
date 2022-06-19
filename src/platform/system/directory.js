/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const path = require('node:path');
const os = require('node:os');

const platform = os.type();

function home() {
    if (typeof os.homedir === 'function') {
        return os.homedir();
    }

    switch (platform) {
        case 'Windows_NT':
            return path.resolve(process.env.USERPROFILE);

        case 'Linux':
        case 'Darwin':
            return path.resolve(process.env.HOME);

        default:
            throw new Error(`Unsupported operating system: ${platform}.`);
    }
}

function desktop() {
    return path.join(home(), 'Desktop');
}

function appData() {
    switch (platform) {
        case 'Windows_NT':
            return typeof process.env.APPDATA === 'string'
                ? path.resolve(process.env.APPDATA)
                : path.join(home(), 'AppData');

        case 'Linux':
            return typeof process.env.XDG_CONFIG_HOME === 'string'
                ? path.resolve(process.env.XDG_CONFIG_HOME)
                : path.resolve(path.join(home(), '.config'));

        case 'Darwin':
            return path.resolve(path.join(home(), 'Library', 'Application Support'));
    }
}

function temp() {
    if (typeof os.tmpdir === 'function') {
        return os.tmpdir();
    }

    switch (platform) {
        case 'Windows_NT':
            return path.resolve(process.env.TEMP);

        case 'Linux':
        case 'Darwin':
            return path.resolve('/tmp');

        default:
            throw new Error(`Unsupported operating system: ${platform}.`);
    }
}

module.exports = {
    home,
    desktop,
    appData,
    temp
};
