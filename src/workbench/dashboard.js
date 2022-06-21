/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import {isNil, isNone, isObject, isText, parseNumeric} from './lib/core-toolkit.js';

import Primate from './primate.js';

import TokenInputDirective from './directives/token-input.js';
import MultiCheckDirective from './directives/multi-check.js';
import ClipboardTextDirective from './directives/clipboard-text.js';
import RecordMapDirective from './directives/record-map.js';
import RecordTextDirective from './directives/record-text.js';

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
import ReleaseInfoController from './controllers/release-info.js';

import {DashboardTemplate} from './template.js';
import RouteListController from './controllers/route-list.js';

import ThemeEngine from './interface/theme-engine.js';

const {/** @type {IPCBridge} */ ipcBridge, document} = window;

/**
 * Stores responses from asynchronous IPC events.
 */
const responseLocker = {
    completedSteps: 0,
    config: {}
};

/**
 * Initializes REST client and View frame factory.
 *
 * @param {import('./services/rest-provider.js').RESTClientProvider} restProvider - The REST client provider.
 * @param {import('./services/view-frame-provider.js').ViewFrameProvider} vfProvider - The view actory provider.
 */
function finalFactoryInitializer(restProvider, vfProvider) {
    restProvider.initialize({
        /* TODO : Include basic auth not provided. */
        host: responseLocker.host
    });

    vfProvider.initialize(responseLocker);
}

/**
 * Attempts to start the Angular application if all the required steps are completed.
 *
 * @returns {boolean} True if application started, false otherwise.
 */
function attemptStart() {
    if (responseLocker.completedSteps < 2) {
        return false;
    }

    responseLocker.completedSteps = -10;

    Primate.config(finalFactoryInitializer, 'restClient', 'viewFrame');
    Primate.start();

    return true;
}

/**
 * Attaches application wide event listeners.
 *
 * @param {Object} rootScope - Angular root scope object.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 * @param {LoggerFactory} logger - Factory for logging activities.
 */
function attachEventListeners(rootScope, viewFrame, logger) {
    document.body.querySelector('div.app-layout').classList.remove('hidden');

    const main = document.getElementById('mainWrapper');

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
            ipcBridge.sendRequest('Open-External-Link', {url: anchor.href});

            logger.info(`Opening ${anchor.href}`);
        }

        return true;
    });
}

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

    const fields = ['showFooter', 'showBreadcrumbs', 'dateFormat'];

    for (let field of fields) {
        responseLocker.config[field] = config[field];
    }

    responseLocker.completedSteps++;
    return attemptStart();
});

ipcBridge.onResponse('Read-Session-Connection', (connection) => {
    if (!isText(connection.adminHost) || !isText(connection.protocol)) {
        return false;
    }

    const adminPort = parseNumeric(connection.adminPort, 8001);

    responseLocker.host = `${connection.protocol}://${connection.adminHost}:${adminPort}`;
    responseLocker.config.sessionId = connection.id;
    responseLocker.config.sessionName = connection.name;
    responseLocker.config.sessionColor = connection.colorCode;
    responseLocker.config.sessionURL = responseLocker.host;
    responseLocker.completedSteps++;

    return attemptStart();
});

ipcBridge.onEventPush('Open-Settings-View', () => {
    window.location.href = '#!/settings';
});

ipcBridge.onEventPush('Open-Release-Info', () => {
    window.location.href = '#!/release-info/current';
});

Primate.directive(TokenInputDirective);
Primate.directive(MultiCheckDirective);
Primate.directive(ClipboardTextDirective);
Primate.directive(RecordMapDirective);
Primate.directive(RecordTextDirective);

/* Register sidebar, header and footer controllers. */
Primate.controller(SidebarController, 'restClient', 'viewFrame', 'toast');
Primate.controller(HeaderController, 'restClient', 'viewFrame', 'toast', 'logger');
Primate.controller(FooterController, 'restClient', 'viewFrame', 'toast', 'logger');

/* Register node details controllers. */
Primate.controller(OverviewController, 'restClient', 'viewFrame', 'toast');
Primate.controller(NodeConfigController, 'restClient', 'viewFrame', 'toast');

/* Register object handler controllers. */
Primate.controller(TagSearchController, 'restClient', 'viewFrame', 'toast');

Primate.controller(ServiceListController, 'restClient', 'viewFrame', 'toast');
Primate.controller(ServiceEditController, '$location', '$routeParams', 'restClient', 'viewFrame', 'toast', 'logger');

Primate.controller(RouteListController, 'restClient', 'viewFrame', 'toast');
Primate.controller(RouteEditController, '$location', '$routeParams', 'restClient', 'viewFrame', 'toast', 'logger');

Primate.controller(CertificateListController, 'restClient', 'viewFrame', 'toast');
Primate.controller(CertificateEditController, '$location', '$routeParams', 'restClient', 'viewFrame', 'toast');
Primate.controller(TrustedCAEditController, '$location', '$routeParams', 'restClient', 'viewFrame', 'toast');

Primate.controller(UpstreamListController, 'restClient', 'viewFrame', 'toast');
Primate.controller(UpstreamEditController, '$location', '$routeParams', 'restClient', 'viewFrame', 'toast');

Primate.controller(ConsumerListController, 'restClient', 'viewFrame', 'toast');
Primate.controller(ConsumerEditController, '$location', '$routeParams', 'restClient', 'viewFrame', 'toast', 'logger');

Primate.controller(PluginListController, 'restClient', 'viewFrame', 'toast');
Primate.controller(PluginEditController, '$location', '$routeParams', 'restClient', 'viewFrame', 'toast');

Primate.controller(SettingsController, 'restClient', 'viewFrame', 'toast');

Primate.controller(ReleaseInfoController, '$routeParams', 'restClient', 'viewFrame', 'toast');

Primate.config(DashboardTemplate, '$route');

Primate.onReady(attachEventListeners, '$rootScope', 'viewFrame', 'logger');

ipcBridge.sendRequest('Read-Session-Connection');
ipcBridge.sendRequest('Read-Workbench-Config');
