/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

export default {
    version: window.appBridge.getVersion(),
    publishedAt: 1694323695,
    author: 'Ajay Sreedhar <ajaysreedhar05@gmail.com>',
    downloadLink: '',
    adminAPIList: ['v2.7.x', 'v2.8.x'],
    releaseNotes: {
        features: [],
        upgrades: [
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
        ]
    }
};
