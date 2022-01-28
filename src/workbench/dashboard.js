/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import _ from '../lib/core-utils.js';

import KongDash from './kongdash.js';

import TokenInputDirective from './components/token-input-directive.js';
import MultiCheckDirective from './components/multi-check-directive.js';

import HeaderController from './controllers/header.js';
import FooterController from './controllers/footer.js';
import SidebarController from './controllers/sidebar.js';
import OverviewController from './controllers/overview.js';
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

const {/** @type {IPCHandler} */ ipcHandler} = window;

/**
 *
 * @param {RESTClientProvider} provider
 */
function initRESTClient(provider) {
    const defaultHost = window.ipcHandler.sendQuery('Read-Session-Connection');

    if (_.isText(defaultHost.adminHost) && false === _.isEmpty(defaultHost.adminHost)) {
        provider.initialize({
            /* TODO : Include basic auth not provided. */
            host: `${defaultHost.protocol}://${defaultHost.adminHost}:${defaultHost.adminPort}`
        });
    }
}

/**
 * Attaches application wide event listeners.
 *
 * @param {Window} window - Top level window object.
 * @param {Object} rootScope - Angular root scope object.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 * @param {LoggerFactory} logger - Factory for logging activities.
 */
function attachEventListeners(window, rootScope, viewFrame, logger) {
    const main = window.document.querySelector('main.content');

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
            ipcHandler.sendQuery('open-external', anchor.href);

            logger.info(`Opening ${anchor.href}`);
        }

        return true;
    });
}

ipcHandler.onEventPush('Open-Settings-View', () => {
    window.location.href = '#!/settings';
});

KongDash.config(['restClientProvider', initRESTClient]);

KongDash.directive('tokenInput', ['$window', TokenInputDirective]);
KongDash.directive('multiCheck', ['$window', MultiCheckDirective]);

KongDash.controller('SidebarController', ['$scope', 'restClient', 'toast', SidebarController]);

KongDash.controller('HeaderController', ['$scope', 'restClient', 'viewFrame', 'toast', 'logger', HeaderController]);

KongDash.controller('FooterController', ['$scope', '$http', 'viewFrame', 'toast', 'logger', FooterController]);

KongDash.controller('OverviewController', ['$scope', 'restClient', 'toast', 'viewFrame', OverviewController]);

KongDash.controller('ServiceListController', ['$scope', 'restClient', 'viewFrame', 'toast', ServiceListController]);

KongDash.controller('ServiceEditController', [
    '$scope',
    '$location',
    '$routeParams',
    'restClient',
    'viewFrame',
    'toast',
    'logger',
    ServiceEditController
]);

KongDash.controller('RouteListController', ['$scope', 'restClient', 'viewFrame', 'toast', RouteListController]);

KongDash.controller('RouteEditController', [
    '$scope',
    '$location',
    '$routeParams',
    'restClient',
    'viewFrame',
    'toast',
    'logger',
    RouteEditController
]);

KongDash.controller('CertificateListController', [
    '$scope',
    'restClient',
    'viewFrame',
    'toast',
    CertificateListController
]);

KongDash.controller('CertificateEditController', [
    '$scope',
    '$location',
    '$routeParams',
    'restClient',
    'viewFrame',
    'toast',
    CertificateEditController
]);

KongDash.controller('TrustedCAEditController', [
    '$scope',
    '$location',
    '$routeParams',
    'restClient',
    'viewFrame',
    'toast',
    'logger',
    TrustedCAEditController
]);

KongDash.controller('UpstreamListController', ['$scope', 'restClient', 'viewFrame', 'toast', UpstreamListController]);

KongDash.controller('UpstreamEditController', [
    '$scope',
    '$location',
    '$routeParams',
    'restClient',
    'viewFrame',
    'toast',
    UpstreamEditController
]);

KongDash.controller('ConsumerListController', ['$scope', 'restClient', 'viewFrame', 'toast', ConsumerListController]);

KongDash.controller('ConsumerEditController', [
    '$scope',
    '$location',
    '$routeParams',
    'restClient',
    'viewFrame',
    'toast',
    'logger',
    ConsumerEditController
]);

KongDash.controller('PluginListController', ['$scope', 'restClient', 'viewFrame', 'toast', PluginListController]);

KongDash.controller('PluginEditController', [
    '$scope',
    '$location',
    '$routeParams',
    'restClient',
    'viewFrame',
    'toast',
    PluginEditController
]);

KongDash.controller('SettingsController', [
    '$rootScope',
    '$scope',
    'restClient',
    'viewFrame',
    'toast',
    SettingsController
]);

KongDash.config(['$routeProvider', Templates]);

KongDash.run(['$window', '$rootScope', 'viewFrame', 'logger', attachEventListeners]);
