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

console.log('handler', typeof window.ipcHandler);

if (typeof window.ipcHandler === 'object') {
    window.ipcHandler.registerListener('workbench:AsyncResponse', 'Write-Connection', () => {
        window.ipcHandler.removeListeners();
        window.location.href = './dashboard.html';
    });
}

KongDash.controller('ClientSetupController', ['$scope', 'restClient', 'viewFrame', 'toast', ClientSetupController]);

KongDash.controller('FooterController', [
    '$window',
    '$scope',
    '$http',
    'viewFrame',
    'toast',
    'logger',
    FooterController
]);
