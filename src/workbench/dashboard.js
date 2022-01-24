/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import KongDash from './kongdash.js';

import TokenInputDirective from './components/token-input-directive.js';
import MultiCheckDirective from './components/multi-check-directive.js';

import HeaderController from './controllers/header.js';
import FooterController from './controllers/footer.js';
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

const {ipcRenderer} = require('electron');
const kongConfig = ipcRenderer.sendSync('get-config', 'kong');
const appConfig = ipcRenderer.sendSync('get-config', 'app');

/**
 *
 * @param {RESTClientProvider} provider
 */
function initRESTClient(provider) {
    const options = {host: kongConfig.host};

    /* Add a basic authorization header
     * if username and password are provided in the settings. */
    if (typeof kongConfig.username === 'string' && kongConfig.username) {
        options.authorization = `${kongConfig.username}:` + (kongConfig.password || '');
    }

    provider.initialize(options);
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
    const {angular} = window;
    const main = window.document.querySelector('main.content');

    rootScope.ngViewAnimation = appConfig.enableAnimation ? 'fade' : '';

    rootScope.$on('$locationChangeStart', (event, next) => {
        viewFrame.clearActions();
        viewFrame.resetLoader();

        if (next.indexOf('#') > 1) {
            let refArray = next.split('#!/')[1].split('/');
            let href = '#!/' + refArray[0],
                nav = angular.element('nav.navigation');

            nav.find('a.navigation__link').removeClass('active');
            nav.find('.navigation__link[data-ng-href="' + href + '"]').addClass('active');
        }
    });

    main.addEventListener('click', (event) => {
        const {target: anchor} = event;

        if (anchor.nodeName !== 'A') {
            return true;
        }

        if (anchor.target === '_blank') {
            event.preventDefault();
            ipcRenderer.send('open-external', anchor.href);

            logger.info(`Opening ${anchor.href}`);
        }

        return true;
    });
}

KongDash.config(['restClientProvider', initRESTClient]);

KongDash.directive('tokenInput', ['$window', TokenInputDirective]);
KongDash.directive('multiCheck', ['$window', MultiCheckDirective]);

KongDash.controller('HeaderController', ['$window', '$scope', 'restClient', 'viewFrame', 'toast', 'logger', HeaderController]);

KongDash.controller('FooterController', ['$window', '$scope', '$http', 'viewFrame', 'toast', 'logger', FooterController]);

KongDash.controller('OverviewController', ['$window', '$scope', 'restClient', 'toast', 'viewFrame', OverviewController]);

KongDash.controller('ServiceListController', ['$window', '$scope', 'restClient', 'viewFrame', 'toast', 'logger', ServiceListController]);

KongDash.controller('ServiceEditController', [
    '$window',
    '$scope',
    '$location',
    '$routeParams',
    'restClient',
    'viewFrame',
    'toast',
    'logger',
    ServiceEditController
]);

KongDash.controller('RouteEditController', [
    '$window',
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
    '$window',
    '$scope',
    'restClient',
    'viewFrame',
    'toast',
    'logger',
    CertificateListController
]);

KongDash.controller('CertificateEditController', [
    '$window',
    '$scope',
    '$location',
    '$routeParams',
    'restClient',
    'viewFrame',
    'toast',
    CertificateEditController
]);

KongDash.controller('TrustedCAEditController', [
    '$window',
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
    '$window',
    '$scope',
    '$location',
    '$routeParams',
    'restClient',
    'viewFrame',
    'toast',
    UpstreamEditController
]);

KongDash.controller('ConsumerListController', ['$scope', 'restClient', 'viewFrame', 'toast', 'logger', ConsumerListController]);

KongDash.controller('ConsumerEditController', [
    '$window',
    '$scope',
    '$location',
    '$routeParams',
    'restClient',
    'viewFrame',
    'toast',
    'logger',
    ConsumerEditController
]);

KongDash.controller('PluginListController', ['$window', '$scope', 'restClient', 'viewFrame', 'toast', PluginListController]);

KongDash.controller('PluginEditController', [
    '$window',
    '$scope',
    '$location',
    '$routeParams',
    'restClient',
    'viewFrame',
    'toast',
    'logger',
    PluginEditController
]);

KongDash.controller('SettingsController', ['$window', '$rootScope', '$scope', 'restClient', 'viewFrame', 'toast', SettingsController]);

KongDash.config(['$routeProvider', Templates]);

KongDash.run(['$window', '$rootScope', 'viewFrame', 'logger', attachEventListeners]);

ipcRenderer.on('open-settings-view', () => {
    /* TODO: use $location */
    window.location.href = '#!/settings';
});
