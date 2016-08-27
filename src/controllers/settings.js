app.controller('SettingsController', ['$rootScope', '$scope', 'viewFactory', 'toast', function ($rootScope, $scope, viewFactory, toast) {
    viewFactory.deleteAction = viewFactory.prevUrl = null;
    viewFactory.title = 'Settings';

    $scope.kongConfig = kongConfig;
    $scope.appConfig = ipcRenderer.sendSync('get-app-config', '');

    var formKongConfig = angular.element('form#formKongConfig');

    formKongConfig.on('submit', function () {
        viewFactory.host = kongConfig.host = $scope.kongConfig.host;
        kongConfig.username = $scope.kongConfig.username;
        kongConfig.password = $scope.kongConfig.password;

        ipcRenderer.send('write-kong-config', $scope.kongConfig);

        ipcRenderer.on('write-kong-config-success', function () {
            toast.success('Kong configuration saved')

        }).on('write-app-config-error', function (event, arg) {
            toast.error(arg.message)
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

        ipcRenderer.send('write-app-config', $scope.appConfig);

        ipcRenderer.on('write-app-config-success', function () {
            toast.success('App configuration saved')

        }).on('write-app-config-error', function (event, arg) {
            toast.error(arg.message)
        });
    });
}]);