app.controller('DashboardController', ['$scope', '$http', 'viewFactory', 'toast', function ($scope, $http, viewFactory, toast) {

    viewFactory.title = 'Dashboard';
    viewFactory.prevUrl = viewFactory.deleteAction = null;

    $http({
        method: 'GET',
        url: buildUrl( '/' )
    }).then(function (response) {
        $scope.kongStat = response.data;
        $scope.database = $scope.kongStat.configuration.database;

    }, function () {
        toast.error('Could not populate data');
    })
}]);