/* global app:true ipcRenderer:true */
(function (angular, app, ipcRenderer) { 'use strict';
    const controller = 'FooterController';
    if (typeof app === 'undefined') throw (controller + ': app is undefined');

    const semver = require('semver');
    const version = ipcRenderer.sendSync('get-config', 'VERSION');

    app.controller(controller, ['$scope', '$element', '$http', 'viewFactory', 'toast',
        function ($scope, $element, $http, viewFactory, toast) {
        $scope.viewFactory = viewFactory;

        $http({
            method: 'GET',
            url : 'https://api.github.com/repos/ajaysreedhar/kongdash/releases/latest'

        }).then(function (response) {
            let release = response.data;

            if (release.draft === false && release.prerelease === false && semver.gt(release.tag_name, version)) {
                toast.info('New version ' + release.name + ' available');

                $element.find('#staticMessage').html(angular.element('<a></a>', {
                    href: release.html_url
                }).html('New version ' + release.name + ' available'));
            }

        }, function () {
            /* Ignore */
        });
    }]);
})(window.angular, app, ipcRenderer);