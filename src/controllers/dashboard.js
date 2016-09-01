app.controller('DashboardController', ['$scope', 'kdAjax', 'kdToast', 'viewFactory', function ($scope, kdAjax, kdToast, viewFactory) {

    viewFactory.title = 'Dashboard';
    viewFactory.prevUrl = null;

    kdAjax.get({
        resource: '/'
    }).then(function (response) {
        $scope.kongStat = response.data;
        $scope.database = $scope.kongStat.configuration.database;

    }, function () {
        kdToast.error('Could not populate data');
    })
}]);