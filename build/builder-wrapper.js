/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const os = require('node:os');

const inquirer = require('inquirer');
const builder = require('electron-builder');

const {configureLinuxOptions, configureMacOptions, configureWin32Options} = require('./builder-platform');

async function prepareBuilderOptions() {
    const platform = os.type();

    if (platform === 'Linux') {
        const choice = await inquirer.prompt([
            {
                type: 'rawlist',
                name: 'type',
                message: 'Choose the package type',
                choices: ['Snap', 'AppImage', 'Tarball']
            }
        ]);

        return configureLinuxOptions(choice.type);
    } else if (platform === 'Darwin') {
        return configureMacOptions();
    } else if (platform === 'Windows_NT') {
        return configureWin32Options();
    }

    throw new Error(`Unsupported operating system: ${platform}.`);
}

async function buildRelease() {
    try {
        const options = await prepareBuilderOptions();
        const paths = await builder.build(options);

        return paths[0];
    } catch (error) {
        throw new Error(`Builder failed: ${error}`);
    }
}

module.exports = {buildRelease};
