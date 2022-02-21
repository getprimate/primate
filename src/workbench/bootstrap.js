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

const {/** @type {IPCBridge} */ ipcBridge} = window;

ipcBridge.onResponse('Read-Theme-Style', (style) => {
    if (isObject(style) && isNil(style.error)) {
        let themeEngine = new ThemeEngine();
        themeEngine.applyTheme(style);

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

KongDash.controller(ClientSetupController, 'restClient', 'viewFrame', 'toast');
KongDash.controller(FooterController, '$http', 'viewFrame', 'toast', 'logger');

ipcBridge.onResponse('Read-Default-Connection', (connection) => {
    if (isText(connection.adminHost) && isText(connection.protocol)) {
        const adminPort = parseNumeric(connection.adminPort, 8001);

        KongDash.config(
            (restProvider, vfProvider) => {
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
            },
            'restClient',
            'viewFrame'
        );
    }

    KongDash.start();
});

ipcBridge.sendRequest('Read-Workbench-Config');
