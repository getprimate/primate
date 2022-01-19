'use strict';

/**
 * @typedef {Object} ViewFrameFactory
 * @property {string} prevUrl - previous template URL for navigation
 * @property {string} title - current template title
 * @property {string} host - current Kong API host
 * @property {[Object]} actionButtons - array of action button objects
 */

/* global app:true kongConfig:true appConfig:true */
(function (angular, app, kongConfig, appConfig) {
    if (typeof app === 'undefined') throw 'app-index.js: app is undefined';

    /**
     * Holds current page title, current host URL and
     * URL of the previous page.
     */
    app.factory('viewFrame', () => {
        return {
            title: '',
            prevUrl: '',
            host: kongConfig.host,
            actionButtons: []
        };
    });

    /**
     * Configures route provider and ajax provider.
     */
    app.config([
        '$routeProvider',
        'ajaxProvider',
        function ($routeProvider, ajaxProvider) {
            ajaxProvider.setHost(kongConfig.host);
            ajaxProvider.contentType('application/json; charset=utf-8');
            ajaxProvider.accept('application/json');

            /* Add a basic authorization header
         if username and password are provided in the settings. */
            if (typeof kongConfig.username === 'string' && kongConfig.username) {
                ajaxProvider.basicAuth(kongConfig.username, kongConfig.password || '');
            }

            /* Configure routes. */
            $routeProvider
                .when('/', {
                    templateUrl: 'views/dashboard.html',
                    controller: 'DashboardController'
                })
                .when('/services', {
                    templateUrl: 'views/service-list.html',
                    controller: 'ServiceListController'
                })
                .when('/services/:serviceId', {
                    templateUrl: 'views/service-edit.html',
                    controller: 'ServiceEditController'
                })
                .when('/certificates', {
                    templateUrl: 'views/certificate-list.html',
                    controller: 'CertificateListController'
                })
                .when('/certificates/:certId', {
                    templateUrl: 'views/certificate-edit.html',
                    controller: 'CertificateEditController'
                })
                .when('/trusted-cas/:caId', {
                    templateUrl: 'views/ca-edit.html',
                    controller: 'TrustedCAEditController'
                })
                .when('/upstreams', {
                    templateUrl: 'views/upstream-list.html',
                    controller: 'UpstreamListController'
                })
                .when('/upstreams/:upstreamId', {
                    templateUrl: 'views/upstream-edit.html',
                    controller: 'UpstreamEditController'
                })
                .when('/certificates/:certId/upstreams/:upstreamId', {
                    templateUrl: 'views/upstream-edit.html',
                    controller: 'UpstreamEditController'
                })
                .when('/settings', {
                    templateUrl: 'views/settings.html',
                    controller: 'SettingsController'
                });

            /* Configure route for listing and editing Route objects. */
            $routeProvider
                .when('/routes', {
                    controller: 'RouteListController',
                    templateUrl: 'views/route-list.html'
                })
                .when('/routes/:routeId', {
                    controller: 'RouteEditController',
                    templateUrl: 'views/route-edit.html'
                })
                .when('/services/:serviceId/routes/:routeId', {
                    controller: 'RouteEditController',
                    templateUrl: 'views/route-edit.html'
                });

            /* Configure route for listing and editing Consumer objects. */
            $routeProvider
                .when('/consumers', {
                    controller: 'ConsumerListController',
                    templateUrl: 'views/consumer-list.html'
                })
                .when('/consumers/:consumerId', {
                    controller: 'ConsumerEditController',
                    templateUrl: 'views/consumer-edit.html'
                });

            $routeProvider
                .when('/plugins', {
                    templateUrl: 'views/plugin-list.html',
                    controller: 'PluginListController'
                })
                .when('/plugins/:pluginId', {
                    templateUrl: 'views/plugin-edit.html',
                    controller: 'PluginEditController'
                })
                .when('/services/:serviceId/plugins/:pluginId', {
                    templateUrl: 'views/plugin-edit.html',
                    controller: 'PluginEditController'
                })
                .when('/routes/:routeId/plugins/:pluginId', {
                    templateUrl: 'views/plugin-edit.html',
                    controller: 'PluginEditController'
                })
                .when('/services/:serviceId/routes/:routeId/plugins/:pluginId', {
                    templateUrl: 'views/plugin-edit.html',
                    controller: 'PluginEditController'
                })
                .when('/consumers/:consumerId/plugins/:pluginId', {
                    templateUrl: 'views/plugin-list.html',
                    controller: 'PluginListController'
                });

            $routeProvider.otherwise({
                templateUrl: 'views/dashboard.html',
                controller: 'DashboardController'
            });
        }
    ]);

    /**
     * Detects and highlights the correct
     * sidebar link upon location change.
     */
    app.run([
        '$rootScope',
        'viewFrame',
        function ($rootScope, viewFrame) {
            $rootScope.ngViewAnimation = appConfig.enableAnimation ? 'fade' : '';

            $rootScope.$on('$locationChangeStart', (event, next, current) => {
                viewFrame.prevUrl = current;
                viewFrame.actionButtons.splice(0);

                if (next.indexOf('#') > 1) {
                    let refArray = next.split('#!/')[1].split('/');
                    let href = '#!/' + refArray[0],
                        nav = angular.element('nav.navigation');

                    nav.find('a.navigation__link').removeClass('active');
                    nav.find('.navigation__link[data-ng-href="' + href + '"]').addClass('active');
                }
            });
        }
    ]);
})(window.angular, app, kongConfig, appConfig);

/* global angular:true ipcRenderer:true */
(function (window, angular, content, ipcRenderer) {
    ipcRenderer.on('open-settings-view', () => {
        /* TODO: use $location */
        window.location.href = '#!/settings';
    });

    /**
     * Open all external links in default browser.
     */
    content.on('click', 'a[href^="http"]', (event) => {
        event.preventDefault();
        ipcRenderer.send('open-external', event.target.href);
    });

    /**
     * Deletes a resource when a delete button is pressed.
     */
    content.on('click', '.delete', (event) => {
        event.preventDefault();

        const target = angular.element(event.target);
        const action = target.hasClass('disable') ? 'Disable' : 'Delete';

        if (confirm(action + ' this ' + target.data('target') + '?')) {
            let ajax = angular.element('html').injector().get('ajax');
            let toast = angular.element('body').injector().get('toast');

            ajax.delete({resource: target.data('url')}).then(
                () => {
                    toast.success(target.data('target') + ' ' + action.toLowerCase() + 'd');

                    if (event.target.nodeName === 'I' || event.target.nodeName === 'SPAN') {
                        const tr = target.parents('tr');
                        tr.remove();
                    } else {
                        window.location.href = target.data('redirect');
                    }
                },
                (response) => {
                    toast.error(response.data);
                }
            );
        }
    });

    /**
     * Redirects to specified action page.
     */
    content.on('click', 'button.btn.create', (event) => {
        event.preventDefault();

        let target = angular.element(event.target);
        window.location.href = target.data('redirect');
    });
})(window, window.angular, angular.element('main.content'), ipcRenderer);
