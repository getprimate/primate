/* global app:true */
(function (app) { 'use strict';

    const controller = 'ServiceListController';
    if (typeof app === 'undefined') throw (controller + ': app is undefined');

    app.controller(controller, ['$window', '$scope', 'ajax', 'toast', 'viewFrame', function ($window, $scope, ajax, toast, viewFrame) {
        const { angular } = $window;

        viewFrame.title = 'Service List';
        viewFrame.prevUrl = null;

        $scope.formInput = {
            name: '',
            retries: 5,
            protocol: 'http',
            host: '',
            port: 80,
            path: '/', 
            connectTimeout: 60000,
            writeTimeout: 60000,
            readTimeOut: 60000,
            tags: '', 
            clientCertificate: null,
            tlsVerify: null, 
            tlsVerifyDepth: null,
            caCertificates: []
        };

        $scope.serviceList = [];
        $scope.fetchServiceList = function (resource) {
            ajax.get({ resource: resource }).then(function (response) {
                $scope.nextUrl = (typeof response.data.next === 'string') ?
                    response.data.next.replace(new RegExp(viewFrame.host), '') : '';

                for (let index = 0; index < response.data.data.length; index++) {
                    $scope.serviceList.push(response.data.data[index]);
                }

            }, function () {
                toast.error('Could not load list of services');
            });
        };

        let panelAdd = angular.element('div#panelAdd');
        let serviceForm = panelAdd.children('div.panel__body').children('form');

        let table = angular.element('table#serviceTable');

        table.on('click', 'i.state-highlight', function (event) {
            let icon = angular.element(event.target);
            let payload = {};
            let attribute = icon.data('attribute');

            payload[attribute] = !(icon.hasClass('success'));

            ajax.patch({
                resource: '/services/' + icon.data('service-id'),
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
            serviceForm.slideToggle(300);
        });

        serviceForm.on('submit', function (event) {
            event.preventDefault();

            let payload = {}, tags = $scope.formInput.tags.trim();

            if ($scope.formInput.name.trim().length > 1) {
                payload.name = $scope.formInput.name;

            } else {
                serviceForm.find('input[name="serviceName"]').focus();
                return false;
            }

            if ($scope.formInput.host.trim().length > 1) {
                payload.host = $scope.formInput.host;

            } else {
                serviceForm.find('input[name="host"]').focus();
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

            if (tags.length > 0) {
                payload.tags = tags.split(',');
            }

            ajax.post({
                resource: '/services',
                data: payload
            }).then(function (response) {
                $scope.serviceList.push(response.data);

                toast.success('New service \'' + payload.name + '\' added');

            }, function (response) {
                toast.error(response.data);
            });

            return false;
        });

        serviceForm.on('click', 'button[name="actionCancel"]', function () {
            serviceForm.slideUp(300);
        });

        $scope.fetchServiceList('/services');
    }]);

})(app);