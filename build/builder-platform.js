/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const path = require('node:path');

const {Arch, Platform} = require('electron-builder');

const {ROOT_DIR, ICON_DIR, RES_DIR} = require('./constant');
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
        icon: path.join(ROOT_DIR, 'resources', 'icons', '256x256.icns'),
        iconSize: 96,
        title: 'KongDash v1.0.0',
        contents: [
            {
                x: 175,
                y: 195,
                type: 'file'
            },

            {
                x: 540,
                y: 195,
                type: 'link',
                path: '/Applications'
            }
        ]
    };

    return {config, targets};
}

/**
 * Configures packager options for Windows targets.
 *
 * The default installer is NSIS.
 *
 * @returns {PackagerOptions} The packager options for electron builder.
 */
function configureWin32Options() {
    const config = releaseConfig;
    const targets = Platform.WINDOWS.createTarget('nsis', Arch.x64);

    config.win = {
        target: 'nsis',
        icon: path.join(ICON_DIR, '256x256.ico'),
        legalTrademarks: 'KongDash'
    };

    config.nsis = {
        oneClick: false,
        perMachine: false,
        allowToChangeInstallationDirectory: true,
        installerIcon: path.join(ICON_DIR, 'installerIcon.ico'),
        uninstallerIcon: path.join(ICON_DIR, 'uninstallerIcon.ico'),
        uninstallDisplayName: 'KongDash',
        license: path.join(RES_DIR, 'license.txt'),
        artifactName: `${config.productName}-v1.0.0-Setup-x64`
    };

    return {config, targets};
}

module.exports = {
    configureLinuxOptions,
    configureMacOptions,
    configureWin32Options
};
