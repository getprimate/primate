/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import _ from '../lib/core-utils.js';

import KongDash from './kongdash.js';
import FooterController from './controllers/footer.js';
import ClientSetupController from './controllers/client-setup.js';

const {ipcRenderer} = require('electron');

function removeIPCListeners() {
    const channels = ['workbench:AsyncResponse', 'workbench:AsyncError', 'workbench:AsyncEventPush'];

    for (let channel of channels) {
        ipcRenderer.removeAllListeners(channel);
    }
}

ipcRenderer.on('workbench:AsyncResponse', (event, action) => {
    if (action === 'Write-Connection') {
        removeIPCListeners();
        window.location.href = './dashboard.html';
    }
});

KongDash.controller('ClientSetupController', ['$scope', 'restClient', 'viewFrame', 'toast', ClientSetupController]);
KongDash.controller('FooterController', ['$window', '$scope', '$http', 'viewFrame', 'toast', 'logger', FooterController]);
