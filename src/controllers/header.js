(function (angular, app) {

    var controller = 'HeaderController';

    if (typeof app === 'undefined') {
        throw ( controller + ': app is undefined');
    }

    app.controller(controller, ['$scope', 'viewFactory', function ($scope, viewFactory) {
        $scope.viewFactory = viewFactory;
        $scope.title = 'Dashboard';
    }]);
})(window.angular, app);