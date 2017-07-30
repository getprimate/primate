/* global app:true */
(function (app) { 'use strict';

    const controller = 'ClusterListController';
    if (typeof app === 'undefined') throw (controller + ': app is undefined');

    app.controller(controller, ['$scope', 'ajax', 'toast', 'viewFactory', function ($scope, ajax, toast, viewFactory) {

        viewFactory.title = 'Cluster';
        viewFactory.prevUrl = null;

        $scope.clusterList = [];

        $scope.fetchClusterList = function (resource) {
            ajax.get({ resource: resource }).then(function (response) {
                $scope.nextUrl = (typeof response.data.next === 'string') ?
                    response.data.next.replace(new RegExp(viewFactory.host), '') : '';

                for (let index = 0; index < response.data.data.length; index++ ) {
                    $scope.clusterList.push(response.data.data[index]);
                }
            }, function () {
                toast.error('Could not load list of clusters');
            });
        };

        $scope.fetchClusterList('/cluster');
    }]);
})(app);