(function (angular, app, ipcRenderer, kongConfig, appConfig) {

    var controller = 'SettingsController';

    if (typeof app === 'undefined') {
        throw ( controller + ': app is undefined');
    }

    app.controller(controller, ['$rootScope', '$scope', 'viewFactory', 'toast', function ($rootScope, $scope, viewFactory, toast) {
        viewFactory.prevUrl = null;
        viewFactory.title = 'Settings';

        $scope.kongConfig = kongConfig;
        $scope.appConfig  = appConfig;
        $scope.version = ipcRenderer.sendSync('get-config', 'VERSION');

        var formKongConfig = angular.element('form#formKongConfig');

        formKongConfig.on('submit', function () {
            viewFactory.host = kongConfig.host = $scope.kongConfig.host;
            kongConfig.username = $scope.kongConfig.username;
            kongConfig.password = $scope.kongConfig.password;

            ipcRenderer.send('write-config', { name: 'kong', config: $scope.kongConfig });

            ipcRenderer.on('write-config-success', function () {
                toast.success('Kong configuration saved');

            }).on('write-config-error', function (event, arg) {
                toast.error(arg.message);
            });

            return false;
        });

        angular.element('#toggleAnimation').on('click', function (event) {
            var checkbox = angular.element(event.target);

            if (checkbox.is(':checked')) {
                $rootScope.ngViewAnimation = 'slide-right';
                $scope.appConfig.enableAnimation = true;

            } else {
                $rootScope.ngViewAnimation = '';
                $scope.appConfig.enableAnimation = false;
            }

            ipcRenderer.send('write-config', { name: 'app', config: $scope.appConfig });

            ipcRenderer.on('write-config-success', function () {
                toast.success('App configuration saved');

            }).on('write-config-error', function (event, arg) {
                toast.error(arg.message);
            });
        });
    }]);
})(window.angular, app, ipcRenderer, kongConfig, appConfig);