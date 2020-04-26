/* global app:true */
(function (angular, app) { 'use strict';
    const controller = 'PluginListController';
    if (typeof app === 'undefined') throw (controller + ': app is undefined');

    app.controller(controller, ['$scope', '$routeParams', 'ajax', 'viewFactory', 'toast',
        function ($scope, $routeParams, ajax, viewFactory, toast) {
        viewFactory.title = 'Plugin List';

        let filters = [];

        if ($routeParams.consumerId) {
            filters.push('consumer_id=' + $routeParams.consumerId);
            // allows search of all plugins
            filters.push('size=10000');
        }
        else viewFactory.prevUrl = null;

        $scope.pluginList = [];
        $scope.fetchPluginList = function(resource) {
            ajax.get({ resource: resource }).then(function (response) {
                $scope.nextUrl = (typeof response.data.next === 'string') ?
                    response.data.next.replace(new RegExp(viewFactory.host), '') : '';

                for (let index = 0; index < response.data.data.length; index++) {
                    let p = response.data.data[index];
                    p.api_name = "fetching ...";
                    $scope.pluginList.push(response.data.data[index]);
                }

            }, function () {
                toast.error('Could not load list of plugins');
            })
            .then(
                function getApiNames( response ) {
                    for ( let p of $scope.pluginList ) {
                        console.log("p api",p.api_id);
                        ajax.get({ resource: "/apis/" + p.api_id })
                            .then((response) => p.api_name = response.data.name );
                    }
                }
            );
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

        let searchBox = angular.element('#search > .typeahead');

        let origList = $scope.pluginList;

        searchBox.on('keyup',(el)=>{
            let reg = new RegExp(el.target.value);
            $scope.pluginList = origList.filter((plugin) => {
                console.log(plugin);
                return reg.test(plugin.api_name);
            });
            $scope.$apply();
        });
    }]);
})(window.angular, app);