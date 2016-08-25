app.controller('HeaderController', ['$scope', 'viewFactory', function ($scope, viewFactory) {
    $scope.viewFactory = viewFactory;
    $scope.title = 'Dashboard';
}]);