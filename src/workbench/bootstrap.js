/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import {isNil, isNone, isObject, isText} from './lib/core-toolkit.js';

import Primate from './primate.js';
import ThemeEngine from './interface/theme-engine.js';

import SidebarController from './controllers/sidebar.js';
import HeaderController from './controllers/header.js';
import FooterController from './controllers/footer.js';
import ReleaseInfoController from './controllers/release-info.js';
import ClientSetupController from './controllers/client-setup.js';
import WelcomeIntroController from './controllers/welcome-intro.js';

import {BootstrapTemplate} from './template.js';

import SidebarNavDirective from './directives/sidebar-nav.js';

const {
    /**
     * IPC bridge exposed over isolated context.
     *
     * @type {IPCBridge}
     */
    ipcBridge,
    document
} = window;

/**
 * Attaches application wide event listeners.
 */
function attachEventListeners() {
    const main = document.getElementById('mainWrapper');

    main.addEventListener('click', (event) => {
        const {target: anchor} = event;

        if (anchor.nodeName !== 'A') {
            return true;
        }

        if (anchor.target === '_blank') {
            event.preventDefault();
            ipcBridge.sendRequest('Open-External-Link', {url: anchor.href});
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
        /**
         * Configures REST client and view frame factories.
         *
         * @param {RESTClientProvider} restProvider - The REST client provider.
         * @param {ViewFrameProvider} vfProvider - The view frame provider.
         */
        const configure = (restProvider, vfProvider) => {
            const options = {host: `${connection.protocol}://${connection.adminHost}`};

            if (isObject(connection.basicAuth) && connection.basicAuth.credentials.length >= 2) {
                options.authorization = connection.basicAuth.credentials;
            }

            restProvider.initialize(options);

            vfProvider.initialize({
                config: {
                    sessionId: connection.id,
                    sessionName: connection.name,
                    sessionColor: connection.colorCode,
                    sessionURL: `${connection.protocol}://${connection.adminHost}`
                },
                state: {
                    layoutName: 'bootstrap'
                }
            });
        };

        Primate.config(configure, 'restClient', 'viewFrame');
    }

    Primate.start();
});

ipcBridge.onEventPush('Open-Settings-View', () => {
    window.location.href = '#!/';
});

ipcBridge.onEventPush('Open-Release-Info', () => {
    window.location.href = '#!/release-info/current';
});

Primate.config(BootstrapTemplate, '$route');

Primate.directive(SidebarNavDirective);

Primate.controller(ClientSetupController, 'restClient', 'viewFrame', 'toast');
Primate.controller(SidebarController, 'restClient', 'viewFrame', 'toast');
Primate.controller(WelcomeIntroController, '$location', 'viewFrame');
Primate.controller(HeaderController, 'restClient', 'viewFrame', 'toast');
Primate.controller(FooterController, 'restClient', 'viewFrame', 'toast', 'logger');
Primate.controller(ReleaseInfoController, '$routeParams', 'restClient', 'viewFrame', 'toast');

Primate.onReady(attachEventListeners);

ipcBridge.sendRequest('Read-Workbench-Config');
