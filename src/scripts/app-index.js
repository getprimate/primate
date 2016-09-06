/* global app:true ipcRenderer:true kongConfig:true appConfig:true */
(function (angular, app, ipcRenderer, kongConfig, appConfig) {

    if (typeof app === 'undefined') {
        throw 'app-index.js: app is undefined';
    }

    /**
     * Holds current page title, current host URL and
     * URL of the previous page.
     */
    app.factory('viewFactory', function () {
        return { title: '', prevUrl: '', host: kongConfig.host };
    });

    /**
     * Configures route provider and ajax provider
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
                var refArray = next.split('#/')[1].split('/');

                var href = '#/' + refArray[0], nav = angular.element('nav.navigation');

                nav.find('a.navigation__link').removeClass('active');
                nav.find('.navigation__link[data-ng-href="' + href + '"]').addClass('active');
            }
        });
    }]);

})(window.angular, app, ipcRenderer, kongConfig, appConfig);

/* global angular:true electron:true */
(function (angular, content, electron) {

    /**
     * Open all external links in default browser.
     */
    content.on('click', 'a[href^="http"]', function (event) {
        event.preventDefault();
        electron.shell.openExternal(event.target.href);
    });

    /**
     * Deletes a resource when a delete button is pressed.
     */
    content.on('click', '.delete', function (event) {
        var target = angular.element(event.target);

        if (confirm ('Delete this ' + target.data('target') + '?')) {
            var ajax  = angular.element('html').injector().get('ajax');
            var toast = angular.element('body').injector().get('toast');

            ajax.delete({
                resource: target.data('url')
            }).then(function () {
                toast.success(target.data('target') + ' deleted');

                if ( event.target.nodeName == 'I' ) target.parents('tr').fadeOut(200);
                else window.location.href = target.data('redirect');

            }, function (response) {
                toast.error(response.data);
            });
        }
    });
})(window.angular, angular.element('main.content'), electron);
