(function (angular, app) {
    'use strict';

    var controller = 'PluginListController';

    if (typeof app === 'undefined') {
        throw ( controller + ': app is undefined');
    }

    app.controller(controller, ['$scope', '$routeParams', 'ajax', 'viewFactory', 'toast',
        function ($scope, $routeParams, ajax, viewFactory, toast) {

        viewFactory.title = 'Plugin List';

        var filters = [];

        if ($routeParams.consumerId) {
            filters.push('consumer_id=' + $routeParams.consumerId);

        } else {
            viewFactory.prevUrl = null;
        }

        $scope.pluginList = [];
        $scope.fetchPluginList = function(url) {
            ajax.get({
                resource: url
            }).then(function (response) {
                $scope.nextUrl = response.data.next || '';

                for (var i=0; i<response.data.data.length; i++ ) {
                    $scope.pluginList.push(response.data.data[i]);
                }

            }, function () {
                toast.error('Could not load list of plugins');
            });
        };

        angular.element('#pluginsTable').on('click', 'input[type="checkbox"].plugin-state', function (event) {
            var checkbox = angular.element(event.target), payload={};

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