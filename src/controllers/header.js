/* global app:true */
(function (app) { 'use strict';
    const controller = 'HeaderController';
    if (typeof app === 'undefined') throw (controller + ': app is undefined');

    app.controller(controller, ['$scope', 'viewFrame', function ($scope, viewFrame) {
        $scope.viewFrame = viewFrame;
        $scope.title = 'Dashboard';
    }]);
})(app);