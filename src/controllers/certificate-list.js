/* global app:true */
(function (angular, app) { 'use strict';
    const controller = 'CertificateListController';
    if (typeof app === 'undefined') throw (controller + ': app is undefined');

    app.controller(controller, ['$scope', 'ajax', 'viewFactory', 'toast', function ($scope, ajax, viewFactory, toast) {
        viewFactory.title = 'Certificate List';
        viewFactory.prevUrl = null;

        $scope.certList = [];
        $scope.formInput = {
            certificate: '',
            privateKey: '',
            snis: ''
        };

        $scope.fetchCertList = function (resource) {
            ajax.get({ resource: resource }).then(function (response) {
                $scope.nextUrl = (typeof response.data.next === 'string') ?
                    response.data.next.replace(new RegExp(viewFactory.host), '') : '';

                for (let index = 0; index < response.data.data.length; index++ ) {
                    $scope.certList.push(response.data.data[index]);
                }

            }, function () {
                toast.error('Could not load certificates');
            });
        };

        let panelAdd = angular.element('div#panelAdd');
        let certForm = panelAdd.children('div.panel__body').children('form');

        panelAdd.children('div.panel__heading').on('click', function () {
            certForm.slideToggle(300);
        });

        certForm.on('submit', function (event) {
            event.preventDefault();

            let payload = {};

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
                payload.snis = $scope.formInput.snis;
            }

            ajax.post({
                resource: '/certificates/',
                data: payload
            }).then(function (response) {
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