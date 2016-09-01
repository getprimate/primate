var {ipcRenderer} = require('electron');
var kongConfig = ipcRenderer.sendSync('get-kong-config');

var app = angular.module('KongDashApp', ['ngRoute', 'ngAnimate', 'kongdash']);

app.config(['$routeProvider', 'kdAjaxProvider' , function ($routeProvider, kdAjaxProvider) {

    kdAjaxProvider.setHost(kongConfig.host);

    /* Add a basic authorization header
    if username and password are provided in the settings */
    if (typeof kongConfig.username === 'string' && kongConfig.username) {
        kdAjaxProvider.basicAuth(kongConfig.username, kongConfig.password || '');
    }

    /* Configure routeProvider */
    $routeProvider
        .when('/', {
            templateUrl: 'views/dashboard.html',
            controller: 'DashboardController'
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
}]);

/**
 * Converts first letter of a string to uppercase and
 * replaces underscores with whitespaces.
 */
app.filter('pgname', function () {
    return function (input) {
        if (typeof input != 'string' || input == null) {
            return '';
        }

        return (input.charAt(0).toUpperCase() + input.substr(1).toLowerCase()).split('_').join(' ');
    }
});

/**
 * Strips protocol (http:// or https://) from URL.
 */
app.filter('stripProtocol', function () {
    return function (input) {
        if (!input) return '';

        if (input.indexOf('s://') > 1) return input.split('https://')[1];

        return (input.split('http://')[1]) || '';
    }
});

/**
 * Joins a string array with commas.
 */
app.filter('splice', function () {
    return function (input) {
        if (typeof input != 'object') {
            return '';
        }

        return input.join(', ');
    };
});

/**
 * Holds current page title, current host URL and
 * URL of the previous page.
 */
app.factory('viewFactory', function () {
    return { title: '', prevUrl: '', host: kongConfig.host }
});

/**
 * Detects and highlights the correct
 * sidebar link upon location change.
 */
app.run(['$rootScope', 'viewFactory', function ($rootScope, viewFactory) {
    var appConfig = ipcRenderer.sendSync('get-app-config');

    $rootScope.ngViewAnimation = appConfig.enableAnimation ? 'slide-right' : '';

    $rootScope.$on('$locationChangeStart', function (event, next, current) {
        viewFactory.deleteAction = null;
        viewFactory.prevUrl = current;

        if (next.indexOf('#') > 1) {
            var refArray = next.split('#/')[1].split('/');

            var href = '#/' + refArray[0], nav = angular.element('nav.navigation');

            nav.find('a.navigation__link').removeClass('active');
            nav.find('.navigation__link[data-ng-href="' + href + '"]').addClass('active')
        }
    })
}]);
