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
            $scope.formInput.upstreamUrl = response.data.upstream_url;
            $scope.formInput.requestPath = (typeof response.data.request_path === 'undefined') ? '' : response.data.request_path;
            $scope.formInput.requestHost = (typeof response.data.request_host === 'undefined') ? '' : response.data.request_host;
            $scope.formInput.apiName = (typeof response.data.name === 'undefined') ? '' : response.data.name;
            $scope.formInput.preserveHost = response.data.preserve_host;
            $scope.formInput.stripRequestPath = response.data.strip_request_path;

            viewFactory.deleteAction = {target: 'API', url: '/apis/' + $scope.apiId, redirect: '#/api'};

        }, function (response) {
            toast.error('Could not load API details');

            if (response && response.status === 404) window.location.href = '#/api';
        });

        var apiForm = angular.element('form#formEdit');

        apiForm.on('submit', function (event) {
            event.preventDefault();

            var payload = {};

            if ($scope.formInput.apiName.trim().length > 1) {
                payload.name = $scope.formInput.apiName;
            }

            if ($scope.formInput.requestHost.trim().length > 1) {
                payload.request_host = $scope.formInput.requestHost;
            }

            if (typeof payload.name === 'undefined' &&
                typeof payload.request_host === 'undefined') {
                apiForm.find('input[name="apiName"]').focus();
                return false;
            }

            if ($scope.formInput.requestPath.trim().length > 1) {
                payload.request_path = $scope.formInput.requestPath;
            }

            if ( typeof payload.request_path === 'undefined' &&
                typeof payload.request_host === 'undefined') {
                apiForm.find('input[name="requestPath"]').focus();
                return false;
            }

            if ($scope.formInput.upstreamUrl.trim().length > 1) {
                payload.upstream_url = $scope.formInput.upstreamUrl;
            } else {
                apiForm.find('input[name="upstreamUrl"]').focus();
                return false;
            }

            payload.strip_request_path = $scope.formInput.stripRequestPath;
            payload.preserve_host = $scope.formInput.preserveHost;

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