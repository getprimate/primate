/* global app:true */
(function (angular, app) { 'use strict';
    const controller = 'CertificateListController';

    if (typeof app === 'undefined') throw (controller + ': app is undefined');

    app.controller(controller, ['$scope', 'ajax', 'viewFactory', 'toast', function ($scope, ajax, viewFactory, toast) {
        $scope.formInput = {
            certificate: '',
            privateKey: '',
            snis: ''
        };

        $scope.certList = [];

        $scope.fetchCertList = function (resource) {
            ajax.get({ resource: resource }).then(function (response) {
                $scope.nextUrl = response.data.next || '';

                for (let i = 0; i < response.data.data.length; i++ ) {
                    $scope.certList.push(response.data.data[i]);
                }

            }, function () {
                toast.error('Could not load certificates');
            });
        };

        viewFactory.title = 'Certificate List';
        viewFactory.prevUrl = null;

        var panelAdd = angular.element('div#panelAdd');
        var certForm = panelAdd.children('div.panel__body').children('form');

        certForm.on('submit', function (event) {
            event.preventDefault();

            var payload = {};

            if ($scope.formInput.certificate.trim().length > 10) {
                payload.cert = $scope.formInput.certificate;

            } else {
                certForm.find('textarea[name="certificate"]').focus();
                return false;
            }

            if ($scope.formInput.privateKey.trim().length > 10) {
                payload.key = $scope.formInput.privateKey;

            } else {
                certForm.find('textarea[name="privateKey"]').focus();
                return false;
            }

            if ($scope.formInput.snis.trim().length > 0) {
                payload.snis = $scope.formInput.snis.split(',');
            }

            ajax.post({
                resource: '/certificates/',
                data: payload
            }).then(function(response) {
                $scope.certList.push(response.data);
                toast.success('Added new certificate');

            }, function (response) {
                toast.error(response.data);
            });

            return false;
        });

        certForm.on('click', 'button[name="actionCancel"]', function () {
            certForm.slideUp(300);
        });

        $scope.fetchCertList('/certificates/');
    }]);

})(window.angular, app);