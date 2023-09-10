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
                primaryText: 'Support for adding paths in connection setup.',
                description: []
            }
        ],
        bugfixes: [
            {
                primaryText: 'Fixed basic user authentication in connection setup.',
                description: []
            }
        ],
        upgrades: [
            {
                primaryText: 'Electron to version 19.x.x',
                description: []
            }
        ]
    }
};
