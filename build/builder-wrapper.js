/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const inquirer = require('inquirer');
const builder = require('electron-builder');
const {configureLinuxBuild} = require('./builder-platform');

async function buildPackage(platform) {
    const rawOptions = {target: {}, config: {}};

    if (platform === 'linux') {
        const type = await inquirer.prompt([
            {
                type: 'rawlist',
                name: 'type',
                message: 'Choose the package type',
                choices: ['snap', 'tar.gz', 'flatpak']
            }
        ]);

        console.log('Types: ', JSON.stringify(type, null, 4));
    }
}

module.exports = {buildPackage};
