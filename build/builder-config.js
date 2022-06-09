/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const releaseConfig = {
    appId: 'com.kongdash',
    productName: 'KongDash',
    copyright: 'Copyright (c) 2022 Ajay Sreedhar',
    asar: true,
    compression: 'normal',
    removePackageScripts: true,
    nodeGypRebuild: false,
    buildDependenciesFromSource: false,
    files: [
        {
            from: 'out/platform',
            to: 'platform'
        },
        {
            from: 'out/workbench',
            to: 'workbench'
        },
        'package.json'
    ],
    directories: {
        output: 'dist'
    },
    extraResources: [
        {from: 'resources/themes', to: 'themes'},
        {from: 'resources/icons/', to: 'icons'}
    ],
    extraMetadata: {
        main: 'platform/main.js'
    }
};

module.exports = {releaseConfig};
