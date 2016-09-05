/* global app:true */
(function (app) {
    'use strict';

    var controller = 'ClusterListController';
    if (typeof app === 'undefined') throw (controller + ': app is undefined');

    app.controller(controller, ['$scope', 'ajax', 'toast', 'viewFactory', function ($scope, ajax, toast, viewFactory) {

        viewFactory.title = 'Cluster';
        viewFactory.prevUrl = null;

        $scope.clusterList = [];

        $scope.fetchClusterList = function (resource) {
            ajax.get({ resource: resource }).then(function (response) {
                $scope.nextUrl = response.data.next || '';

                for (var i = 0; i < response.data.data.length; i++ ) {
                    $scope.clusterList.push(response.data.data[i]);
                }
            }, function () {
                toast.error('Could not load list of clusters');
            });
        };

        $scope.fetchClusterList('/cluster');
    }]);
})(app);