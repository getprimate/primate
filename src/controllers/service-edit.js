/* global app:true */
(function (angular, app) { 'use strict';

    const controller = 'ServiceEditController';
    if (typeof app === 'undefined') throw (controller + ': app is undefined');

    app.controller(controller, ['$window', '$scope', '$routeParams', 'ajax', 'toast' ,'viewFactory',
        function ($window, $scope, $routeParams, ajax, toast, viewFactory) {

        viewFactory.title = 'Edit Service';

        $scope.serviceId = $routeParams.serviceId;
        $scope.formInput = {};
        $scope.pluginList = [];

        $scope.fetchPluginList = function (url) {
            ajax.get({ resource: url }).then(function (response) {
                $scope.nextPluginUrl = (typeof response.data.next === 'string') ?
                    response.data.next.replace(new RegExp(viewFactory.host), '') : '';

                for (let index = 0; index < response.data.data.length; index++) {
                    $scope.pluginList.push(response.data.data[index]);
                }

            }, function () {
                toast.error('Could not load plugin list');
            });
        };

        ajax.get({ resource: '/services/' + $scope.serviceId }).then(function (response) {
            $scope.formInput.name = response.data.name;
            $scope.formInput.methods = Array.isArray(response.data.methods) ? response.data.methods.join() : '';
            $scope.formInput.uris = Array.isArray(response.data.uris) ? response.data.uris.join() : '';
            $scope.formInput.hosts = Array.isArray(response.data.hosts) ? response.data.hosts.join() : '';
            $scope.formInput.upstreamUrl = response.data.upstream_url;

            $scope.formInput.retries = response.data.retries;
            $scope.formInput.connectTimeout = response.data.upstream_connect_timeout;
            $scope.formInput.sendTimeout = response.data.upstream_send_timeout;
            $scope.formInput.readTimeout = response.data.upstream_read_timeout;

            $scope.formInput.httpsOnly = response.data.https_only;
            $scope.formInput.httpIfTerminated = response.data.http_if_terminated;
            $scope.formInput.preserveHost = response.data.preserve_host;
            $scope.formInput.stripUri = response.data.strip_uri;

            viewFactory.deleteAction = {target: 'API', url: '/services/' + $scope.serviceId, redirect: '#!/services'};

        }, function () {
            toast.error('Could not load API details');
            $window.location.href = '#!/services';
        });

        let serviceForm = angular.element('form#formEdit');

        serviceForm.on('submit', function (event) {
            event.preventDefault();

            let payload = {};

            if ($scope.formInput.name.trim().length > 1) {
                payload.name = $scope.formInput.name;

            } else {
                serviceForm.find('input[name="serviceName"]').focus();
                return false;
            }

            payload.hosts = Array.isArray($scope.formInput.hosts) ? $scope.formInput.hosts.join() : $scope.formInput.hosts;
            payload.uris = Array.isArray($scope.formInput.uris) ? $scope.formInput.uris.join() : $scope.formInput.uris;
            payload.methods = Array.isArray($scope.formInput.methods) ? $scope.formInput.methods.join() : $scope.formInput.methods;

            if (typeof payload.hosts === 'undefined'
                && typeof payload.uris === 'undefined'
                && typeof payload.methods === 'undefined') {

                serviceForm.find('input[name="hosts"]').focus();
                return false;
            }

            if ($scope.formInput.upstreamUrl.trim().length > 1) {
                payload.upstream_url = $scope.formInput.upstreamUrl;

            } else {
                serviceForm.find('input[name="upstreamUrl"]').focus();
                return false;
            }

            payload.retries = (isNaN($scope.formInput.retries) || !$scope.formInput.retries) ?
                5 : parseInt($scope.formInput.retries);

            payload.upstream_connect_timeout = (isNaN($scope.formInput.connectTimeout) || !$scope.formInput.connectTimeout) ?
                60000 : parseInt($scope.formInput.connectTimeout);

            payload.upstream_send_timeout = (isNaN($scope.formInput.sendTimeout) || !$scope.formInput.sendTimeout) ?
                60000 : parseInt($scope.formInput.sendTimeout);

            payload.upstream_read_timeout = (isNaN($scope.formInput.readTimeout) || !$scope.formInput.readTimeout) ?
                60000 : parseInt($scope.formInput.readTimeout);

            payload.strip_uri = $scope.formInput.stripUri;
            payload.preserve_host = $scope.formInput.preserveHost;
            payload.https_only = $scope.formInput.httpsOnly;
            payload.http_if_terminated = $scope.formInput.httpIfTerminated;

            ajax.patch({
                resource: '/services/' + $scope.serviceId,
                data: payload
            }).then(function () {
                toast.success('API details updated');

            }, function (response) {
                toast.error(response.data);
            });

            return false;
        });

        angular.element('table#pluginListTable').on('click', 'input[type="checkbox"].plugin-state', function (event) {
            let state = (event.target.checked) ? 'enabled' : 'disabled';

            ajax.patch({
                resource: '/services/' + $scope.serviceId + '/plugins/' + event.target.value,
                data: { enabled: (state === 'enabled') },
            }).then(function () {
                toast.success('Plugin ' + event.target.dataset.name + ' ' + state);

            }, function () {
                toast.error('Status could not not be changed');
            });
        });

        $scope.fetchPluginList('/services/' + $scope.serviceId + '/plugins');
    }]);

})(window.angular, app);