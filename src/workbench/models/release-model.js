/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

export default {
    version: window.appBridge.getVersion(),
    publishedAt: 1656499703,
    author: 'Ajay Sreedhar <ajaysreedhar05@gmail.com>',
    downloadLink: '',
    adminAPIList: ['v2.7.x'],
    releaseNotes: {
        features: [
            {
                primaryText: 'KongDash is now renamed as Primate.',
                description: []
            },
            {
                primaryText: 'Supports Kong Admin API v2.7.x',
                description: []
            },
            {
                primaryText: 'Stores multiple connections in history.',
                description: ['All connection information are stored locally in the app data directory.']
            },
            {
                primaryText: 'Supports UI customizations with themes.',
                description: ['Themes can be placed in <app-data>/primate-ce/User-Themes</i> directory.']
            },
            {
                primaryText: 'Added an activity monitor that logs HTTP API calls.',
                description: ['Monitor is helpful while checking HTTP request status.']
            }

        ],
        bugfixes: [
            {
                primaryText: 'Fixed a host configuration issue in settings view.',
                description: []
            }
        ],
        upgrades: [
            {
                primaryText: 'Electron to version 19.x.x',
                description: []
            }
        ]
    },
    contributors: [{
        username: 'ajaysreedhar',
        fullname: 'Ajay Sreedhar',
        profileLink: 'https://github.com/ajaysreedhar',
        description: 'Project maintainer'
    }]
};
