/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const config = require('./builder-config');

module.exports = function (type) {
    switch (type) {
        case 'snap':
            config.linux = {target: 'snap'};

            config.snap = {
                confinement: 'strict',
                grade: 'devel',
                autoStart: false,
                compression: 'xz'
            };
            break;

        default:
            config.linux = {target: 'dir'};
    }

    return config;
};
