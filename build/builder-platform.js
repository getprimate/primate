/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const {Arch, Platform} = require('electron-builder');

const {ICON_DIR} = require('./constant');
const {releaseConfig} = require('./builder-config');

function configureLinuxOptions(type = 'dir') {
    const config = releaseConfig;
    const targets = Platform.LINUX.createTarget(type, Arch.x64);

    config.linux = {
        icon: ICON_DIR,
        synopsis: 'A modern desktop client for Kong Admin API',
        category: 'Development',
        target: 'dir',
        publish: []
    };

    switch (type) {
        case 'snap':
            config.linux.target = 'snap';

            config.snap = {
                confinement: 'strict',
                grade: 'devel',
                autoStart: false,
                compression: 'xz',
                summary: 'A modern desktop client for Kong Admin API'
            };
            break;

        case 'flatpak':
            break;

        case 'tar.gz':
            config.linux.target = 'tar.gz';
            break;

        default:
            config.linux = {target: 'dir'};
            break;
    }

    return {config, targets};
}

module.exports = {
    configureLinuxOptions,
    configureMacOptions: () => {},
    configureWin32Options: () => {}
};
