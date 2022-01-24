/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import KongDash from './kongdash.js';
import FooterController from './controllers/footer.js';
import ClientSetupController from './controllers/client-setup.js';

const {ipcRenderer} = require('electron');

/**
 * Initializes the REST provider.
 *
 * @param {RESTClientProvider} provider - An instance of REST client provider constructor.
 */
function initRESTClient(provider) {
    const kongConfig = ipcRenderer.sendSync('get-config', 'kong');

    if (typeof kongConfig.username === 'string') {
        provider.setBasicAuth(kongConfig.username, kongConfig.password || '');
    }
}

KongDash.config(['restClientProvider', initRESTClient]);

KongDash.controller('ClientSetupController', ['$scope', 'restClient', 'viewFrame', 'toast', ClientSetupController]);
KongDash.controller('FooterController', ['$window', '$scope', '$http', 'viewFrame', 'toast', 'logger', FooterController]);
