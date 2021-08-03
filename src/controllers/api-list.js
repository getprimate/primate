/* global app:true */
(function (angular, app) { 'use strict';

    const controller = 'ApiListController';
    if (typeof app === 'undefined') throw (controller + ': app is undefined');

    app.controller(controller, ['$scope', 'ajax', 'toast', 'viewFactory', function ($scope, ajax, toast, viewFactory) {
        viewFactory.title = 'API List';
        viewFactory.prevUrl = null;

        $scope.formInput = {
            name: '',//
            retries: 5,//
            protocol: 'http',//
            host: '',//
            port: 80,//
            path: '/', //
            connectTimeout: 60000,//
            writeTimeout: 60000,//
            readTimeOut: 60000,//
            tags: '', //
            clientCertificate: null,
            tlsVerify: null, //
            tlsVerifyDepth: null,
            caCertificates: []
        };

        $scope.apiList = [];
        $scope.fetchApiList = function (resource) {
            ajax.get({ resource: resource }).then(function (response) {
                $scope.nextUrl = (typeof response.data.next === 'string') ?
                    response.data.next.replace(new RegExp(viewFactory.host), '') : '';

                for (let index = 0; index < response.data.data.length; index++) {
                    $scope.apiList.push(response.data.data[index]);
                }

            }, function () {
                toast.error('Could not load list of APIs');
            });
        };

        let panelAdd = angular.element('div#panelAdd');
        let apiForm = panelAdd.children('div.panel__body').children('form');

        let table = angular.element('table#apiTable');

        table.on('click', 'i.state-highlight', function (event) {
            let icon = angular.element(event.target);
            let payload = {};
            let attribute = icon.data('attribute');

            payload[attribute] = !(icon.hasClass('success'));

            ajax.patch({
                resource: '/apis/' + icon.data('api-id'),
                data: payload
            }).then(function () {
                if (payload[attribute] === true) {
                    icon.removeClass('default').addClass('success');

                } else {
                    icon.removeClass('success').addClass('default');
                }

                toast.success('Attribute ' + attribute + ' set to ' + payload[attribute]);

            }, function () {
                toast.error('Unable to update ' + attribute);
            });
        });

        panelAdd.children('div.panel__heading').on('click', function () {
            apiForm.slideToggle(300);
        });

        apiForm.on('submit', function (event) {
            event.preventDefault();

            let payload = {};

            if ($scope.formInput.name.trim().length > 1) {
                payload.name = $scope.formInput.name;

            } else {
                apiForm.find('input[name="serviceName"]').focus();
                return false;
            }

            if ($scope.formInput.host.trim().length > 1) {
                payload.host = $scope.formInput.host;

            } else {
                apiForm.find('input[name="host"]').focus();
                return false;
            }

            payload.retries = (isNaN($scope.formInput.retries) || !$scope.formInput.retries) ?
                5 : parseInt($scope.formInput.retries);

            payload.connect_timeout = (isNaN($scope.formInput.connectTimeout) || !$scope.formInput.connectTimeout) ?
                60000 : parseInt($scope.formInput.connectTimeout);

            payload.write_timeout = (isNaN($scope.formInput.writeTimeout) || !$scope.formInput.writeTimeout) ?
                60000 : parseInt($scope.formInput.writeTimeout);

            payload.read_timeout = (isNaN($scope.formInput.readTimeout) || !$scope.formInput.readTimeout) ?
                60000 : parseInt($scope.formInput.readTimeout);

            payload.protocol = $scope.formInput.protocol;
            payload.port = $scope.formInput.port;

            ajax.post({
                resource: '/services',
                data: payload
            }).then(function (response) {
                $scope.apiList.push(response.data);

                toast.success('New service \'' + payload.name + '\' added');

            }, function (response) {
                toast.error(response.data);
            });

            return false;
        });

        apiForm.on('click', 'button[name="actionCancel"]', function () {
            apiForm.slideUp(300);
        });

        $scope.fetchApiList('/services');
    }]);

})(window.angular, app);