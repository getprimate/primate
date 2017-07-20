/* global app:true */
(function (angular, app) { 'use strict';

    const controller = 'ApiEditController';

    if (typeof app === 'undefined') throw (controller + ': app is undefined');

    app.controller(controller, ['$scope', '$routeParams', 'ajax', 'toast' ,'viewFactory',
        function ($scope, $routeParams, ajax, toast, viewFactory) {

        $scope.apiId = $routeParams.apiId;
        $scope.formInput = {};

        viewFactory.title = 'Edit API';
        $scope.pluginList = [];

        $scope.fetchPluginList = function (url) {
            ajax.get({ resource: url }).then(function (response) {
                $scope.nextPluginUrl = response.data.next || '';

                for (let i=0; i<response.data.data.length; i++ ) {
                    $scope.pluginList.push(response.data.data[i]);
                }

            }, function () {
                toast.error('Could not load plugin list');
            });
        };

        ajax.get({ resource: '/apis/' + $scope.apiId }).then(function (response) {
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

            viewFactory.deleteAction = {target: 'API', url: '/apis/' + $scope.apiId, redirect: '#/api'};

        }, function (response) {
            toast.error('Could not load API details');

            if (response && response.status === 404) window.location.href = '#/api';
        });

        var apiForm = angular.element('form#formEdit');

        apiForm.on('submit', function (event) {
            event.preventDefault();

            var payload = {};

            if ($scope.formInput.name.trim().length > 1) {
                payload.name = $scope.formInput.name;

            } else {
                apiForm.find('input[name="apiName"]').focus();
                return false;
            }
            
            payload.hosts = Array.isArray($scope.formInput.hosts) ? $scope.formInput.hosts.join() : $scope.formInput.hosts;
            payload.uris = Array.isArray($scope.formInput.uris) ? $scope.formInput.uris.join() : $scope.formInput.uris;
            payload.methods = Array.isArray($scope.formInput.methods) ? $scope.formInput.methods.join() : $scope.formInput.methods;

            if (typeof payload.hosts === 'undefined' &&
                typeof payload.uris === 'undefined' &&
                typeof payload.methods === 'undefined') {
                apiForm.find('input[name="hosts"]').focus();
                return false;
            }

            if ($scope.formInput.upstreamUrl.trim().length > 1) {
                payload.upstream_url = $scope.formInput.upstreamUrl;

            } else {
                apiForm.find('input[name="upstreamUrl"]').focus();
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
                resource: '/apis/' + $scope.apiId,
                data: payload
            }).then(function () {
                toast.success('API details updated');

            }, function (response) {
                toast.error(response.data);
            });

            return false;
        });

        angular.element('table#pluginListTable').on('click', 'input[type="checkbox"].plugin-state', function (event) {
            var state = 'enabled';

            if (event.target.checked) state = 'enabled';
            else state = 'disabled';

            ajax.patch({
                resource: '/apis/' + $scope.apiId + '/plugins/' + event.target.value,
                data: { enabled: (state === 'enabled') },
            }).then(function () {
                toast.success('Plugin ' + event.target.dataset.name + ' ' + state);

            }, function () {
                toast.error('Status could not not be changed');
            });
        });

        $scope.fetchPluginList('/apis/' + $scope.apiId + '/plugins');
    }]);

})(window.angular, app);