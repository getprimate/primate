/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import {isNil, isNone, isObject, isText, parseNumeric} from './lib/core-toolkit.js';

import KongDash from './kongdash.js';

import TokenInputDirective from './directives/token-input.js';
import MultiCheckDirective from './directives/multi-check.js';
import ClipboardTextDirective from './directives/clipboard-text.js';

import HeaderController from './controllers/header.js';
import FooterController from './controllers/footer.js';
import SidebarController from './controllers/sidebar.js';
import OverviewController from './controllers/overview.js';
import NodeConfigController from './controllers/node-config.js';
import TagSearchController from './controllers/tag-search.js';
import ServiceListController from './controllers/service-list.js';
import ServiceEditController from './controllers/service-edit.js';
import RouteEditController from './controllers/route-edit.js';
import CertificateListController from './controllers/certificate-list.js';
import CertificateEditController from './controllers/certificate-edit.js';
import TrustedCAEditController from './controllers/ca-edit.js';
import UpstreamListController from './controllers/upstream-list.js';
import UpstreamEditController from './controllers/upstream-edit.js';
import ConsumerListController from './controllers/consumer-list.js';
import ConsumerEditController from './controllers/consumer-edit.js';
import PluginListController from './controllers/plugin-list.js';
import PluginEditController from './controllers/plugin-edit.js';
import SettingsController from './controllers/settings.js';

import Templates from './templates.js';
import RouteListController from './controllers/route-list.js';

import ThemeEngine from './interface/theme-engine.js';

const {/** @type {IPCBridge} */ ipcBridge} = window;

/**
 * Attaches application wide event listeners.
 *
 * @param {Window} window - Top level window object.
 * @param {Object} rootScope - Angular root scope object.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 * @param {LoggerFactory} logger - Factory for logging activities.
 */
function attachEventListeners(window, rootScope, viewFrame, logger) {
    window.document.body.querySelector('div.app-layout').classList.remove('hidden');

    const main = window.document.getElementById('mainWrapper');

    rootScope.$on('$locationChangeStart', () => {
        viewFrame.clearActions();
        viewFrame.resetLoader();
    });

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

ipcBridge.onEventPush('Open-Settings-View', () => {
    window.location.href = '#!/settings';
});

ipcBridge.onResponse('Read-Theme-Style', (style) => {
    if (isObject(style) && isNil(style.error)) {
        let themeEngine = new ThemeEngine();
        themeEngine.applyTheme(style);

        themeEngine = null;
    }
});

ipcBridge.onResponse('Read-Workbench-Config', (config) => {
    if (!isNone(config.themeUID)) {
        ipcBridge.sendRequest('Read-Theme-Style', {themeUID: config.themeUID});
    }
});

ipcBridge.onResponse('Read-Session-Connection', (connection) => {
    if (isText(connection.adminHost) && isText(connection.protocol)) {
        const adminPort = parseNumeric(connection.adminPort, 8001);

        const initializer = (restProvider, vfProvider) => {
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

        KongDash.config(initializer, 'restClient', 'viewFrame');
    }

    KongDash.start();
});

KongDash.directive(TokenInputDirective);
KongDash.directive(MultiCheckDirective);
KongDash.directive(ClipboardTextDirective);

/* Register sidebar, header and footer controllers. */
KongDash.controller(SidebarController, 'restClient', 'viewFrame', 'toast');
KongDash.controller(HeaderController, 'restClient', 'viewFrame', 'toast', 'logger');
KongDash.controller(FooterController, '$http', 'viewFrame', 'toast', 'logger');

/* Register node details controllers. */
KongDash.controller(OverviewController, 'restClient', 'viewFrame', 'toast');
KongDash.controller(NodeConfigController, 'restClient', 'viewFrame', 'toast');

/* Register object handler controllers. */
KongDash.controller(TagSearchController, 'restClient', 'viewFrame', 'toast');
KongDash.controller(ServiceListController, 'restClient', 'viewFrame', 'toast');

KongDash.controller(ServiceEditController, '$location', '$routeParams', 'restClient', 'viewFrame', 'toast', 'logger');

KongDash.controller(RouteListController, 'restClient', 'viewFrame', 'toast');

KongDash.controller(RouteEditController, '$location', '$routeParams', 'restClient', 'viewFrame', 'toast', 'logger');

KongDash.controller(CertificateListController, 'restClient', 'viewFrame', 'toast');

KongDash.controller(CertificateEditController, '$location', '$routeParams', 'restClient', 'viewFrame', 'toast');

KongDash.controller(TrustedCAEditController, '$location', '$routeParams', 'restClient', 'viewFrame', 'toast');

KongDash.controller(UpstreamListController, 'restClient', 'viewFrame', 'toast');

KongDash.controller(UpstreamEditController, '$location', '$routeParams', 'restClient', 'viewFrame', 'toast');

KongDash.controller(ConsumerListController, 'restClient', 'viewFrame', 'toast');

KongDash.controller(ConsumerEditController, '$location', '$routeParams', 'restClient', 'viewFrame', 'toast', 'logger');

KongDash.controller(PluginListController, 'restClient', 'viewFrame', 'toast');

KongDash.controller(PluginEditController, '$location', '$routeParams', 'restClient', 'viewFrame', 'toast');

KongDash.controller(SettingsController, 'restClient', 'viewFrame', 'toast');

KongDash.config(Templates, '$route');

KongDash.onReady(attachEventListeners, '$window', '$rootScope', 'viewFrame', 'logger');

ipcBridge.sendRequest('Read-Workbench-Config');
ipcBridge.sendRequest('Read-Session-Connection');
