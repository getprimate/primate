/* global app:true */
((angular, app) => { 'use strict';
    const controller = 'CertificateListController';

    if (typeof app === 'undefined') throw (controller + ': app is undefined');

    app.controller(controller, ['$scope', 'ajax', 'viewFactory', 'toast', function ($scope, ajax, viewFactory, toast) {
        $scope.formInput = {
            certificate: '',
            privateKey: '',
            snis: ''
        };

        $scope.certList = [];

        $scope.fetchCertList = (resource) => {
            ajax.get({ resource: resource }).then((response) => {
                $scope.nextUrl = response.data.next || '';

                for (let i = 0; i < response.data.data.length; i++ ) {
                    $scope.certList.push(response.data.data[i]);
                }

            }, () => {
                toast.error('Could not load certificates');
            });
        };

        viewFactory.title = 'Certificate List';
        viewFactory.prevUrl = null;

        var panelAdd = angular.element('div#panelAdd');
        var certForm = panelAdd.children('div.panel__body').children('form');

        panelAdd.children('div.panel__heading').on('click', () => {
            certForm.slideToggle(300);
        });

        certForm.on('submit', (event) => {
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
            }).then((response) => {
                $scope.certList.push(response.data);
                toast.success('Added new certificate');

            }, (response) => {
                toast.error(response.data);
            });

            return false;
        });

        certForm.on('click', 'button[name="actionCancel"]', () => {
            certForm.slideUp(300);
        });

        $scope.fetchCertList('/certificates/');
    }]);

})(window.angular, app);