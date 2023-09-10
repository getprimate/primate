/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const path = require('node:path');

const {Arch, Platform} = require('electron-builder');

const {ICON_DIR, RES_DIR} = require('./constant');
const {releaseConfig} = require('./builder-config');

function configureLinuxOptions(type = 'dir') {
    const config = releaseConfig;

    config.linux = {
        icon: ICON_DIR,
        synopsis: 'A modern desktop client for Kong Admin API',
        description:
            'Primate is an open source, cross-platform desktop client for Kong Admin API ' +
            'that  helps you connect and manage your Kong gateway instances.',
        category: 'Development',
        target: 'dir',
        publish: [],
        artifactName: '${productName}-v${version}-x64.${ext}',
        desktop: {
            Name: 'Primate',
            Comment: 'Dashboard for Kong Admin API',
            Keywords: 'kong;primate;admin;api;gateway;dashboard',
            Terminal: false
        }
    };

    switch (type) {
        case 'Snap':
            config.linux.executableName = 'primate';
            config.linux.target = 'snap';

            config.snap = {
                confinement: 'strict',
                grade: 'devel',
                autoStart: false,
                summary: 'A modern desktop client for Kong Admin API',
                artifactName: '${productName}-v${version}-x64.snap'
            };
            break;

        case 'AppImage':
            config.linux.target = 'AppImage';
            config.appImage = {
                artifactName: '${productName}-v${version}-x64.AppImage'
            };

            break;

        case 'Tarball':
            config.linux.target = 'tar.gz';
            break;

        default:
            config.linux = {target: 'dir'};
            break;
    }

    const targets = Platform.LINUX.createTarget(config.linux.target, Arch.x64);
    return {config, targets};
}

function configureMacOptions() {
    const config = releaseConfig;
    const targets = Platform.MAC.createTarget('dmg', Arch.x64);

    config.mac = {
        category: 'public.app-category.developer-tools',
        target: 'dmg',
        icon: path.join(ICON_DIR, 'app-scalable.icns')
    };

    config.dmg = {
        background: path.join(RES_DIR, 'dmg-background.png'),
        icon: path.join(ICON_DIR, 'dmg-scalable.icns'),
        iconSize: 96,
        title: 'Install Primate',
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
        ],
        artifactName: '${productName}-v${version}.dmg'
    };

    return {config, targets};
}

/**
 * Configures packager options for Windows targets.
 *
 * The default installer is NSIS.
 *
 * @returns {Object} The packager options for electron builder.
 */
function configureWin32Options() {
    const config = releaseConfig;
    const targets = Platform.WINDOWS.createTarget('nsis', Arch.x64);

    config.win = {
        target: 'nsis',
        icon: path.join(ICON_DIR, 'app-scalable.ico'),
        legalTrademarks: 'Primate'
    };

    config.nsis = {
        oneClick: false,
        perMachine: false,
        allowToChangeInstallationDirectory: true,
        installerIcon: path.join(ICON_DIR, 'installer-scalable.ico'),
        uninstallerIcon: path.join(ICON_DIR, 'uninstaller-scalable.ico'),
        uninstallDisplayName: 'Primate',
        license: path.join(RES_DIR, 'license.txt'),
        artifactName: '${productName}-Setup-v${version}-x64.exe'
    };

    return {config, targets};
}

module.exports = {
    configureLinuxOptions,
    configureMacOptions,
    configureWin32Options
};
