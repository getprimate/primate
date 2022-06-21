/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

export default {
    version: window.appBridge.getVersion(),
    publishedAt: 1655785734,
    author: 'Ajay Sreedhar <ajaysreedhar05@gmail.com>',
    downloadLink: '',
    adminAPIList: ['v2.7.x'],
    releaseNotes: {
        features: [
            {
                primaryText: 'Stores multiple connections in history.',
                description: []
            },
            {
                primaryText: 'Supports UI customizations with themes.',
                description: ['Themes can be placed in <i>/&lt;app-data&gt;/Primate/User-Themes</i> directory']
            }
        ],
        bugfixes: [
            {
                primaryText: 'Fixed host configuration issue in settings view.',
                description: []
            }
        ],
        upgrades: [
            {
                primaryText: 'Supports Kong Admin API v2.7.x',
                description: []
            },
            {
                primaryText: 'Electron to version 19.x.x',
                description: []
            }
        ]
    },
    contributors: []
};
