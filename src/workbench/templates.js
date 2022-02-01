/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

/**
 * Configures route templates.
 *
 * @param {*} routeProvider
 */
export default function Templates(routeProvider) {
    if (typeof routeProvider !== 'object' || routeProvider === null || typeof routeProvider.when !== 'function') {
        throw new TypeError('Parameter is not a valid Route Provider object.');
    }

    routeProvider.when('/node-status', {
        controller: 'NodeStatusController',
        templateUrl: 'static/views/node-status.html'
    });

    /* Configure route templates. */
    routeProvider
        .when('/', {
            templateUrl: 'static/views/overview.html',
            controller: 'OverviewController'
        })
        .when('/services', {
            templateUrl: 'static/views/service-list.html',
            controller: 'ServiceListController'
        })
        .when('/services/:serviceId', {
            templateUrl: 'static/views/service-edit.html',
            controller: 'ServiceEditController'
        })
        .when('/certificates', {
            templateUrl: 'static/views/certificate-list.html',
            controller: 'CertificateListController'
        })
        .when('/certificates/:certId', {
            templateUrl: 'static/views/certificate-edit.html',
            controller: 'CertificateEditController'
        })
        .when('/trusted-cas/:caId', {
            templateUrl: 'static/views/ca-edit.html',
            controller: 'TrustedCAEditController'
        })
        .when('/upstreams', {
            templateUrl: 'static/views/upstream-list.html',
            controller: 'UpstreamListController'
        })
        .when('/upstreams/:upstreamId', {
            templateUrl: 'static/views/upstream-edit.html',
            controller: 'UpstreamEditController'
        })
        .when('/certificates/:certId/upstreams/:upstreamId', {
            templateUrl: 'static/views/upstream-edit.html',
            controller: 'UpstreamEditController'
        })
        .when('/settings', {
            templateUrl: 'static/views/settings.html',
            controller: 'SettingsController'
        });

    /* Configure route for listing and editing Route objects. */
    routeProvider
        .when('/routes', {
            controller: 'RouteListController',
            templateUrl: 'static/views/route-list.html'
        })
        .when('/routes/:routeId', {
            controller: 'RouteEditController',
            templateUrl: 'static/views/route-edit.html'
        })
        .when('/services/:serviceId/routes/:routeId', {
            controller: 'RouteEditController',
            templateUrl: 'static/views/route-edit.html'
        });

    /* Configure route for listing and editing Consumer objects. */
    routeProvider
        .when('/consumers', {
            controller: 'ConsumerListController',
            templateUrl: 'static/views/consumer-list.html'
        })
        .when('/consumers/:consumerId', {
            controller: 'ConsumerEditController',
            templateUrl: 'static/views/consumer-edit.html'
        });

    routeProvider
        .when('/plugins', {
            templateUrl: 'static/views/plugin-list.html',
            controller: 'PluginListController'
        })
        .when('/plugins/:pluginId', {
            templateUrl: 'static/views/plugin-edit.html',
            controller: 'PluginEditController'
        })
        .when('/services/:serviceId/plugins/:pluginId', {
            templateUrl: 'static/views/plugin-edit.html',
            controller: 'PluginEditController'
        })
        .when('/routes/:routeId/plugins/:pluginId', {
            templateUrl: 'static/views/plugin-edit.html',
            controller: 'PluginEditController'
        })
        .when('/services/:serviceId/routes/:routeId/plugins/:pluginId', {
            templateUrl: 'static/views/plugin-edit.html',
            controller: 'PluginEditController'
        })
        .when('/consumers/:consumerId/plugins/:pluginId', {
            templateUrl: 'static/views/plugin-edit.html',
            controller: 'PluginEditController'
        });

    routeProvider.otherwise({
        templateUrl: 'static/views/overview.html',
        controller: 'OverviewController'
    });
}
