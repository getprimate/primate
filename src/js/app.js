var {ipcRenderer} = require('electron');
var kongConfig = ipcRenderer.sendSync('get-kong-config', '');

var buildUrl = function (url) {
    return (kongConfig.host) + url;
};

var app = angular.module('KongDash', ['ngRoute', 'ngAnimate', 'ngToast']);

app.config(['$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider) {
    $httpProvider.defaults.withCredentials = false;

    $routeProvider
        .when('/', {
            templateUrl: 'views/dashboard.html',
            controller: 'DashboardController'
        })
        .when('/api', {
            templateUrl: 'views/apis-list.html',
            controller: 'ApiListController'
        })
        .when('/api/:apiId', {
            templateUrl: 'views/apis-edit.html',
            controller: 'ApiEditController'
        })
        .when('/api/:apiId/plugins', {
            templateUrl: 'views/plugins-edit.html',
            controller: 'PluginEditController'
        })
        .when('/plugins', {
            templateUrl: 'views/plugins-list.html',
            controller: 'PluginListController'
        })
        .when('/plugins/:pluginId', {
            templateUrl: 'views/plugins-edit.html',
            controller: 'PluginEditController'
        })
        .when('/consumers', {
            templateUrl: 'views/consumers-list.html',
            controller: 'ConsumerListController'
        })
        .when('/consumers/:consumerId', {
            templateUrl: 'views/consumers-edit.html',
            controller: 'ConsumerEditController'
        })
        .when('/consumers/:consumerId/plugins', {
            templateUrl: 'views/plugins-list.html',
            controller: 'PluginListController'
        })
        .when('/settings', {
            templateUrl: 'views/settings.html',
            controller: 'SettingsController'
        })
}]);

app.filter('pgname', function () {
    return function (input) {
        if (typeof input != 'string' || input == null) {
            return '';
        }

        return (input.charAt(0).toUpperCase() + input.substr(1).toLowerCase()).split('_').join(' ');
    }
});

app.filter('splice', function () {
    return function (input) {
        if (typeof input != 'object') {
            return '';
        }

        return input.join(', ');
    };
});

app.factory('viewFactory', function () {
    return { title: '', prevUrl: '', host: kongConfig.host }
});

app.run(['$rootScope', 'viewFactory', function ($rootScope, viewFactory) {
    $rootScope.$on('$locationChangeStart', function (event, next, current) {
        viewFactory.prevUrl = current;

        if (next.indexOf('#') > 1) {
            var refArray = next.split('#/')[1].split('/');

            var href = '#/' + refArray[0], nav = angular.element('nav.navigation');

            nav.find('a.navigation__link').removeClass('active');
            nav.find('.navigation__link[data-ng-href="' + href + '"]').addClass('active')
        }
    })
}]);
