/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const path = require('node:path');

const {Arch, Platform} = require('electron-builder');

const {ROOT_DIR, ICON_DIR} = require('./constant');
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

function configureMacOptions() {
    const config = releaseConfig;
    const targets = Platform.MAC.createTarget('dmg', Arch.x64);

    config.mac = {
        category: 'public.app-category.developer-tools',
        target: 'dmg',
        icon: path.join(ICON_DIR, '256x256.icns')
    };

    config.dmg = {
        background: path.join(ROOT_DIR, 'resources', 'dmg-background.png'),
        backgroundColor: '#181922',
        icon: path.join(ROOT_DIR, 'resources', 'icons', '256x256.icns'),
        iconSize: 80,
        title: 'KongDash v1.0.0',
        contents: [
            {
                x: 150,
                y: 200
            },

            {
                x: 150,
                y: 200,
                type: 'link',
                path: '/Applications'
            }
        ]
    };
}

module.exports = {
    configureLinuxOptions,
    configureMacOptions,
    configureWin32Options: () => {}
};
