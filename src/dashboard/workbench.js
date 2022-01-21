/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

/**
 * @typedef {import('./components/view-frame-factory.js').K_ViewFrame} K_ViewFrame
 * @typedef {import('./components/toast-factory.js').K_Toast} K_Toast
 * @typedef {import('./components/logger-factory.js').K_Logger} K_Logger
 */

import KongDash from './kongdash.js';

import HttpInterceptor from './components/http-interceptor.js';

import LoggerFactory from './components/logger-factory.js';
import TokenInputDirective from './components/token-input-directive.js';
import MultiCheckDirective from './components/multi-check-directive.js';

import Templates from './templates.js';

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

const {ipcRenderer} = require('electron');
const kongConfig = ipcRenderer.sendSync('get-config', 'kong');
const appConfig = ipcRenderer.sendSync('get-config', 'app');

KongDash.config(['$httpProvider', HttpInterceptor]);

KongDash.factory('logger', LoggerFactory);

KongDash.directive('tokenInput', ['$window', TokenInputDirective]);
KongDash.directive('multiCheck', ['$window', MultiCheckDirective]);

KongDash.controller('HeaderController', [
    '$window',
    '$scope',
    'ajax',
    'viewFrame',
    'toast',
    'logger',
    HeaderController
]);

KongDash.controller('FooterController', [
    '$window',
    '$scope',
    '$http',
    'viewFrame',
    'toast',
    'logger',
    FooterController
]);

KongDash.controller('OverviewController', ['$window', '$scope', 'ajax', 'toast', 'viewFrame', OverviewController]);

KongDash.controller('ServiceListController', [
    '$window',
    '$scope',
    'ajax',
    'viewFrame',
    'toast',
    'logger',
    ServiceListController
]);

KongDash.controller('ServiceEditController', [
    '$window',
    '$scope',
    '$location',
    '$routeParams',
    'ajax',
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
    'ajax',
    'viewFrame',
    'toast',
    'logger',
    RouteEditController
]);

KongDash.controller('CertificateListController', [
    '$window',
    '$scope',
    'ajax',
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
    'ajax',
    'viewFrame',
    'toast',
    CertificateEditController
]);

KongDash.controller('TrustedCAEditController', [
    '$window',
    '$scope',
    '$location',
    '$routeParams',
    'ajax',
    'viewFrame',
    'toast',
    'logger',
    TrustedCAEditController
]);

KongDash.controller('UpstreamListController', ['$scope', 'ajax', 'viewFrame', 'toast', UpstreamListController]);

KongDash.controller('UpstreamEditController', [
    '$window',
    '$scope',
    '$location',
    '$routeParams',
    'ajax',
    'viewFrame',
    'toast',
    UpstreamEditController
]);

KongDash.controller('ConsumerListController', [
    '$scope',
    'ajax',
    'viewFrame',
    'toast',
    'logger',
    ConsumerListController
]);

KongDash.controller('ConsumerEditController', [
    '$window',
    '$scope',
    '$location',
    '$routeParams',
    'ajax',
    'viewFrame',
    'toast',
    'logger',
    ConsumerEditController
]);

KongDash.controller('PluginListController', ['$window', '$scope', 'ajax', 'viewFrame', 'toast', PluginListController]);

KongDash.controller('PluginEditController', [
    '$window',
    '$scope',
    '$routeParams',
    'ajax',
    'viewFrame',
    'toast',
    'logger',
    PluginEditController
]);

KongDash.controller('SettingsController', [
    '$window',
    '$rootScope',
    '$scope',
    '$base64',
    'ajax',
    'viewFrame',
    'toast',
    SettingsController
]);

KongDash.config(['$routeProvider', Templates]);

KongDash.config([
    'ajaxProvider',
    function (ajaxProvider) {
        ajaxProvider.setHost(kongConfig.host);
        ajaxProvider.contentType('application/json; charset=utf-8');
        ajaxProvider.accept('application/json');

        /* Add a basic authorization header
         if username and password are provided in the settings. */
        if (typeof kongConfig.username === 'string' && kongConfig.username) {
            ajaxProvider.basicAuth(kongConfig.username, kongConfig.password || '');
        }
    }
]);

KongDash.run([
    '$window',
    '$rootScope',
    'viewFrame',
    'logger',

    /**
     *
     * @param {Window} window
     * @param {Object} rootScope
     * @param {K_ViewFrame} viewFrame
     * @param {K_Logger} logger
     */
    function (window, rootScope, viewFrame, logger) {
        const {angular} = window;
        rootScope.ngViewAnimation = appConfig.enableAnimation ? 'fade' : '';

        rootScope.$on('$locationChangeStart', (event, next, current) => {
            viewFrame.addHistory(current);
            viewFrame.getActions().splice(0);

            if (next.indexOf('#') > 1) {
                let refArray = next.split('#!/')[1].split('/');
                let href = '#!/' + refArray[0],
                    nav = angular.element('nav.navigation');

                nav.find('a.navigation__link').removeClass('active');
                nav.find('.navigation__link[data-ng-href="' + href + '"]').addClass('active');
            }
        });

        window.document.querySelector('main.content').addEventListener('click', (event) => {
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
]);

ipcRenderer.on('open-settings-view', () => {
    /* TODO: use $location */
    window.location.href = '#!/settings';
});
