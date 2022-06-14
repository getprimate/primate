/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import {isNil, isNone, isObject, isText, parseNumeric} from './lib/core-toolkit.js';

import KongDash from './kongdash.js';
import ThemeEngine from './interface/theme-engine.js';

import SidebarController from './controllers/sidebar.js';
import HeaderController from './controllers/header.js';
import IdleControlller from './controllers/idle.js';
import ClientSetupController from './controllers/client-setup.js';

import {BootstrapTemplate} from './template.js';

/**
 * IPC bridge exposed over isolated context.
 *
 * @type {IPCBridge}
 */
const ipcBridge = window.ipcBridge;

/**
 * Attaches application wide event listeners.
 *
 * @param {Window} window - Top level window object.
 * @param {Object} rootScope - Angular root scope object.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 * @param {LoggerFactory} logger - Factory for logging activities.
 */
function attachEventListeners(window, rootScope, viewFrame, logger) {
    const main = window.document.getElementById('mainWrapper');

    main.addEventListener('click', (event) => {
        const {target: anchor} = event;

        if (anchor.nodeName !== 'A') {
            return true;
        }

        if (anchor.target === '_blank') {
            event.preventDefault();
            ipcBridge.sendQuery('open-external', anchor.href);

            logger.info(`Opening ${anchor.href}`);
        }

        return true;
    });
}

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

KongDash.config(BootstrapTemplate, '$route');

KongDash.controller(ClientSetupController, 'restClient', 'viewFrame', 'toast');
KongDash.controller(SidebarController, 'restClient', 'viewFrame', 'toast');
KongDash.controller(IdleControlller, '$location', 'viewFrame');
KongDash.controller(HeaderController, 'restClient', 'viewFrame', 'toast', 'logger');

ipcBridge.sendRequest('Read-Workbench-Config');
