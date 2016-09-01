app.controller('DashboardController', ['$scope', 'ajax', 'toast', 'viewFactory', function ($scope, ajax, toast, viewFactory) {

    viewFactory.title = 'Dashboard';
    viewFactory.prevUrl = null;

    ajax.get({
        resource: '/'
    }).then(function (response) {
        $scope.kongStat = response.data;
        $scope.database = $scope.kongStat.configuration.database;

    }, function () {
        toast.error('Could not populate data');
    })
}]);