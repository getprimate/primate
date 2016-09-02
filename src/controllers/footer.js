(function (app) {

    var controller = 'FooterController';

    if (typeof app === 'undefined') {
        throw ( controller + ': app is undefined');
    }

    app.controller(controller, ['$scope', 'viewFactory', function ($scope, viewFactory) {
        $scope.viewFactory = viewFactory;
    }]);
})(app);