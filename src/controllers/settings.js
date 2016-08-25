app.controller('SettingsController', ['$scope', 'viewFactory', 'toast', function ($scope, viewFactory, toast) {
    viewFactory.deleteAction = viewFactory.prevUrl = null;
    viewFactory.title = 'Settings';

    $scope.kongConfig = kongConfig;

    var formKongConfig = angular.element('form#formKongConfig');

    formKongConfig.on('submit', function () {
        viewFactory.host = kongConfig.host = $scope.kongConfig.host;
        kongConfig.username = $scope.kongConfig.username;
        kongConfig.password = $scope.kongConfig.password;

        ipcRenderer.send('write-kong-config', $scope.kongConfig);

        ipcRenderer.on('write-kong-config-success', function () {
            toast.success('Kong configuration saved')

        }).on('write-kong-config-error', function (event, arg) {
            toast.error(arg.message)
        });

        return false;
    })
}]);