app.controller('PluginListController', ['$scope', '$routeParams', '$http', '$httpParamSerializerJQLike', 'viewFactory', 'toast',
    function ($scope, $routeParams, $http, $httpParamSerializerJQLike, viewFactory, toast) {

    viewFactory.title = "Plugin List"
    viewFactory.deleteAction = null

    var filters = []

    if ($routeParams.consumerId) {
        filters.push('consumer_id=' + $routeParams.consumerId)

    } else {
        viewFactory.prevUrl = null
    }

    $http({
        method: 'GET',
        url: buildUrl('/plugins' + ((filters.length > 0) ? ('?' + filters.join('&') ) : ''))
    }).then((response) => {
        $scope.pluginsList = response.data.data

    }, () => {
        toast.error('Could not load list of plugins')
    })

    angular.element('#pluginsTable').on('click', 'input[type="checkbox"].plugin-state', function (event) {
        var checkbox = angular.element(event.target), payload={}

        payload.enabled = checkbox.is(':checked');

        $http({
            method: 'PATCH',
            url: buildUrl('/plugins/' + checkbox.val()),
            data: $httpParamSerializerJQLike(payload),
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        }).then(function () {
            toast.success('Plugin ' + (payload.enabled ? 'enabled' : 'disabled'))

        }, function () {
            toast.error('Could not ' + (payload.enabled ? 'enable' : 'disable') + ' this plugin')
        })
    })
}])