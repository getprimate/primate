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

/**
 * Initializes the REST provider.
 *
 * @param {K_RESTProvider} restProvider - An instance of REST provider constructor.
 */
function initRESTProvider(restProvider) {
    const kongConfig = ipcRenderer.sendSync('get-config', 'kong');

    if (typeof kongConfig.username === 'string') {
        restProvider.setBasicAuth(kongConfig.username, kongConfig.password || '');
    }
}

KongDash.config(['restProvider', initRESTProvider]);

KongDash.controller('BootstrapController', ['$scope', '$element', '$base64', 'ajax', 'viewFrame', 'toast', BootstrapController]);
KongDash.controller('FooterController', ['$window', '$scope', '$http', 'viewFrame', 'toast', 'logger', FooterController]);
