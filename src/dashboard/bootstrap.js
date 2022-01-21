/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import KongDash from './kongdash.js';
import FooterController from './controllers/footer.js';
import BootstrapController from './controllers/bootstrap.js';

const {ipcRenderer} = require('electron');

KongDash.config([
    'ajaxProvider',
    function (ajaxProvider) {
        const kongConfig = ipcRenderer.sendSync('get-config', 'kong');

        ajaxProvider.accept('application/json');
        ajaxProvider.contentType('application/json');

        if (typeof kongConfig.username === 'string') {
            ajaxProvider.basicAuth(kongConfig.username, kongConfig.password || '');
        }
    }
]);

KongDash.controller('BootstrapController', [
    '$scope',
    '$element',
    '$base64',
    'ajax',
    'viewFrame',
    'toast',
    BootstrapController
]);

KongDash.controller('FooterController', [
    '$window',
    '$scope',
    '$http',
    'viewFrame',
    'toast',
    'logger',
    FooterController
]);
