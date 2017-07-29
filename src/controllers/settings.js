/* global app:true ipcRenderer:true kongConfig:true appConfig:true */
(function (angular, app, ipcRenderer, kongConfig, appConfig) { 'use strict';
    const controller = 'SettingsController';

    if (typeof app === 'undefined') throw (controller + ': app is undefined');

    app.controller(controller, ['$rootScope', '$scope', '$base64', 'ajax', 'viewFactory', 'toast', function ($rootScope, $scope, $base64, ajax, viewFactory, toast) {
        viewFactory.prevUrl = null;
        viewFactory.title = 'Settings';

        $scope.kongConfig = kongConfig;
        $scope.appConfig  = appConfig;
        $scope.version = ipcRenderer.sendSync('get-config', 'VERSION');

        let formKongConfig = angular.element('form#formKongConfig');

        ipcRenderer.on('write-config-success', function () {
            toast.success('Settings saved');

        }).on('write-config-error', function (event, arg) {
            toast.error(arg.message);
        });

        formKongConfig.on('submit', function (event) {
            event.preventDefault();

            if ($scope.kongConfig.host.charAt($scope.kongConfig.host.length - 1) === '/') {
                $scope.kongConfig.host = $scope.kongConfig.host.substring(0, $scope.kongConfig.host.length - 1);
            }

            let config = {
                url: $scope.kongConfig.host,
                headers: { 'Authorization': 'Basic ' + $base64.encode($scope.kongConfig.username + ':' + ($scope.kongConfig.password || ''))}
            };

            ajax.get(config).then(function (response) {
                try {
                    if (typeof response.data !== 'object' || typeof response.data.version === 'undefined') {
                        toast.error('Could not detect Kong Admin API running on the provided URL');
                        return;
                    }

                    viewFactory.host = kongConfig.host = $scope.kongConfig.host;
                    kongConfig.username = $scope.kongConfig.username;
                    kongConfig.password = $scope.kongConfig.password;

                    ipcRenderer.send('write-config', { name: 'kong', config: $scope.kongConfig });

                    ajax.setHost(kongConfig.host);
                    ajax.basicAuth($scope.kongConfig.username, $scope.kongConfig.password);

                } catch (e) {
                    toast.error('Could not detect Kong Admin API running on the provided URL');
                }

            }, function (response) {
                if (response.status && parseInt(response.status) === 401 && $scope.kongConfig.username)
                    toast.error('Invalid username or password');

                else if (response.status && parseInt(response.status) === 401)
                    toast.error('Please enter username and password');

                else
                    toast.error('Could not connect to ' + $scope.kongConfig.host);
            });

            return false;
        });

        angular.element('#toggleAnimation').on('click', function (event) {
            let checkbox = angular.element(event.target);

            if (checkbox.is(':checked')) {
                $rootScope.ngViewAnimation = 'slide-right';
                $scope.appConfig.enableAnimation = true;

            } else {
                $rootScope.ngViewAnimation = '';
                $scope.appConfig.enableAnimation = false;
            }

            ipcRenderer.send('write-config', { name: 'app', config: $scope.appConfig });
        });
    }]);
})(window.angular, app, ipcRenderer, kongConfig, appConfig);