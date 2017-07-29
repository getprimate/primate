'use strict';

/* global app:true kongConfig:true appConfig:true */
(function (angular, app, kongConfig, appConfig) {

    if (typeof app === 'undefined') throw 'app-index.js: app is undefined';

    /**
     * Holds current page title, current host URL and
     * URL of the previous page.
     */
    app.factory('viewFactory', function () {
        return { title: '', prevUrl: '', host: kongConfig.host };
    });

    /**
     * Configures route provider and ajax provider.
     */
    app.config(['$routeProvider', 'ajaxProvider' , function ($routeProvider, ajaxProvider) {
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
            .when('/cluster', {
                templateUrl: 'views/cluster-list.html',
                controller: 'ClusterListController'
            })
            .when('/api', {
                templateUrl: 'views/api-list.html',
                controller: 'ApiListController'
            })
            .when('/api/:apiId', {
                templateUrl: 'views/api-edit.html',
                controller: 'ApiEditController'
            })
            .when('/api/:apiId/plugins', {
                templateUrl: 'views/plugin-edit.html',
                controller: 'PluginEditController'
            })
            .when('/plugins', {
                templateUrl: 'views/plugin-list.html',
                controller: 'PluginListController'
            })
            .when('/plugins/:pluginId', {
                templateUrl: 'views/plugin-edit.html',
                controller: 'PluginEditController'
            })
            .when('/consumers', {
                templateUrl: 'views/consumer-list.html',
                controller: 'ConsumerListController'
            })
            .when('/consumers/:consumerId', {
                templateUrl: 'views/consumer-edit.html',
                controller: 'ConsumerEditController'
            })
            .when('/consumers/:consumerId/plugins', {
                templateUrl: 'views/plugin-list.html',
                controller: 'PluginListController'
            })
            .when('/certificates', {
                templateUrl: 'views/certificate-list.html',
                controller: 'CertificateListController'
            })
            .when('/certificates/:certificateId', {
                templateUrl: 'views/certificate-edit.html',
                controller: 'CertificateEditController'
            })
            .when('/upstreams', {
                templateUrl: 'views/upstream-list.html',
                controller: 'UpstreamListController'
            })
            .when('/upstreams/:upstreamId', {
                templateUrl: 'views/upstream-edit.html',
                controller: 'UpstreamEditController'
            })
            .when('/settings', {
                templateUrl: 'views/settings.html',
                controller: 'SettingsController'
            })
            .otherwise({
                templateUrl: 'views/dashboard.html',
                controller: 'DashboardController'
            });
    }]);

    /**
     * Detects and highlights the correct
     * sidebar link upon location change.
     */
    app.run(['$rootScope', 'viewFactory', function ($rootScope, viewFactory) {
        $rootScope.ngViewAnimation = appConfig.enableAnimation ? 'slide-right' : '';

        $rootScope.$on('$locationChangeStart', function (event, next, current) {
            viewFactory.deleteAction = null;
            viewFactory.prevUrl = current;

            if (next.indexOf('#') > 1) {
                let refArray = next.split('#!/')[1].split('/');
                let href = '#!/' + refArray[0], nav  = angular.element('nav.navigation');

                nav.find('a.navigation__link').removeClass('active');
                nav.find('.navigation__link[data-ng-href="' + href + '"]').addClass('active');
            }
        });
    }]);

})(window.angular, app, kongConfig, appConfig);

/* global angular:true ipcRenderer:true */
(function (window, angular, content, ipcRenderer) {

    ipcRenderer.on('open-settings-view', function () {
        /* TODO: use $location */
        window.location.href = '#!/settings';
    });

    /**
     * Open all external links in default browser.
     */
    content.on('click', 'a[href^="http"]', function (event) {
        event.preventDefault();
        ipcRenderer.send('open-external', event.target.href);
    });

    /**
     * Deletes a resource when a delete button is pressed.
     */
    content.on('click', '.delete', function (event) {
        event.preventDefault();

        let target = angular.element(event.target);
        let action = target.hasClass('disable') ? 'Disable' : 'Delete';

        if (confirm (action + ' this ' + target.data('target') + '?')) {
            let ajax  = angular.element('html').injector().get('ajax');
            let toast = angular.element('body').injector().get('toast');

            ajax.delete({ resource: target.data('url') }).then(function () {
                toast.success(target.data('target') + ' ' + action.toLowerCase() + 'd');

                if ( event.target.nodeName === 'I' ) target.parents('tr').fadeOut(200);
                else window.location.href = target.data('redirect');

            }, function (response) {
                toast.error(response.data);
            });
        }
    });

})(window, window.angular, angular.element('main.content'), ipcRenderer);
