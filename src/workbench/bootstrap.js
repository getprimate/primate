/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import {isNil, isNone, isObject, isText, parseNumeric} from '../lib/core-toolkit.js';

import KongDash from './kongdash.js';
import ThemeEngine from './interface/theme-engine.js';

import FooterController from './controllers/footer.js';
import ClientSetupController from './controllers/client-setup.js';

/**
 * IPC bridge exposed over isolated context.
 *
 * @type {IPCBridge}
 */
const ipcBridge = window.ipcBridge;

KongDash.controller(ClientSetupController, 'restClient', 'viewFrame', 'toast');
KongDash.controller(FooterController, '$http', 'viewFrame', 'toast', 'logger');

ipcBridge.onResponse('Read-Theme-Style', (theme) => {
    if (isObject(theme) && isNil(theme.error)) {
        let themeEngine = new ThemeEngine();
        themeEngine.applyTheme(theme);

        themeEngine = null;
    }

    document.body.classList.remove('hidden');
});

ipcBridge.onResponse('Read-Workbench-Config', (config) => {
    if (!isNone(config.themeUID)) {
        ipcBridge.sendRequest('Read-Theme-Style', {themeUID: config.themeUID});
    }

    ipcBridge.sendRequest('Read-Default-Connection');
});

ipcBridge.onResponse('Write-Connection', () => {
    ipcBridge.removeListeners();
    ipcBridge.sendRequest('Create-Workbench-Session');
});

ipcBridge.onResponse('Read-Default-Connection', (connection) => {
    if (isText(connection.adminHost) && isText(connection.protocol)) {
        const adminPort = parseNumeric(connection.adminPort, 8001);

        /**
         * Configures REST client and view frame factories.
         *
         * @param {RESTClientProvider} restProvider - The REST client provider.
         * @param {ViewFrameProvider} vfProvider - The view frame provider.
         */
        const configure = (restProvider, vfProvider) => {
            restProvider.initialize({
                /* TODO : Include basic auth not provided. */
                host: `${connection.protocol}://${connection.adminHost}:${adminPort}`
            });

            vfProvider.initialize({
                config: {
                    sessionId: connection.id,
                    sessionName: connection.name,
                    sessionColor: connection.colorCode,
                    sessionURL: `${connection.protocol}://${connection.adminHost}:${adminPort}`
                }
            });
        };

        KongDash.config(configure, 'restClient', 'viewFrame');
    }

    KongDash.start();
});

ipcBridge.sendRequest('Read-Workbench-Config');
