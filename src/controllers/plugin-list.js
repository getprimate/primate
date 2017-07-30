/* global app:true */
(function (angular, app) { 'use strict';
    const controller = 'PluginListController';
    if (typeof app === 'undefined') throw (controller + ': app is undefined');

    app.controller(controller, ['$scope', '$routeParams', 'ajax', 'viewFactory', 'toast',
        function ($scope, $routeParams, ajax, viewFactory, toast) {
        viewFactory.title = 'Plugin List';

        let filters = [];

        if ($routeParams.consumerId) filters.push('consumer_id=' + $routeParams.consumerId);
        else viewFactory.prevUrl = null;

        $scope.pluginList = [];
        $scope.fetchPluginList = function(resource) {
            ajax.get({ resource: resource }).then(function (response) {
                $scope.nextUrl = (typeof response.data.next === 'string') ?
                    response.data.next.replace(new RegExp(viewFactory.host), '') : '';

                for (let index = 0; index < response.data.data.length; index++) {
                    $scope.pluginList.push(response.data.data[index]);
                }

            }, function () {
                toast.error('Could not load list of plugins');
            });
        };

        angular.element('#pluginsTable').on('click', 'input[type="checkbox"].plugin-state', function (event) {
            let checkbox = angular.element(event.target), payload={};
            payload.enabled = checkbox.is(':checked');

            ajax.patch({
                resource: '/plugins/' + checkbox.val(),
                data: payload
            }).then(function () {
                toast.success('Plugin ' + (payload.enabled ? 'enabled' : 'disabled'));

            }, function () {
                toast.error('Could not ' + (payload.enabled ? 'enable' : 'disable') + ' this plugin');
            });
        });

        $scope.fetchPluginList('/plugins' + ((filters.length > 0) ? ('?' + filters.join('&') ) : ''));
    }]);
})(window.angular, app);