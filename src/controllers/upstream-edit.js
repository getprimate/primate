/* global app:true */
((angular, app) => { 'use strict';
    const controller = 'UpstreamEditController';

    if (typeof app === 'undefined') throw (controller + ': app is undefined');

    app.controller(controller, ['$scope', '$routeParams', 'ajax', 'viewFactory', 'toast',
        function ($scope, $routeParams, ajax, viewFactory, toast) {

            $scope.upstreamId = $routeParams.upstreamId;
            $scope.formInput = {};
            $scope.targetList = [];

            viewFactory.title = 'Edit Upstream';

            ajax.get({ resource: '/upstreams/' + $scope.upstreamId }).then(function (response) {
                $scope.formInput.hostname = response.data.name;
                $scope.formInput.slots = response.data.slots;

                $scope.orderList = (typeof response.data.orderlist === 'object'
                && Array.isArray(response.data.orderlist)) ? response.data.orderlist : '';

                viewFactory.deleteAction = {target: 'Upstream', url: '/upstreams/' + $scope.upstreamId, redirect: '#/upstreams'};

            }, function (response) {
                toast.error('Could not load upstream details');

                if (response && response.status === 404) window.location.href = '#/upstreams';
            });

            var formEdit = angular.element('form#formEdit');
            var formTarget = angular.element('form#formTarget');

            formEdit.on('submit', (event) => {
                event.preventDefault();

                var payload = {};

                if ($scope.formInput.certificate.trim().length > 10) {
                    payload.cert = $scope.formInput.certificate;

                } else {
                    formEdit.find('textarea[name="certificate"]').focus();
                    return false;
                }

                if ($scope.formInput.privateKey.trim().length > 10) {
                    payload.key = $scope.formInput.privateKey;

                } else {
                    formEdit.find('textarea[name="privateKey"]').focus();
                    return false;
                }

                ajax.patch({
                    resource: '/certificates/' + $scope.certId,
                    data: payload
                }).then(() => {
                    toast.success('Certificate updated');

                }, (response) => {
                    toast.error(response.data);
                });

                return false;
            });

            formTarget.on('submit', (event) => {
                event.preventDefault();

                let targetInput = formTarget.children('div.hpadding-10.pad-top-10').children('input[name="target"]');
                let payload = {};

                if (targetInput.val().trim().length <= 0) {
                    return false;
                }

                payload.name = targetInput.val();
                payload.ssl_certificate_id = $scope.certId;

                ajax.post({
                    resource: '/snis/',
                    data: payload
                }).then(function () {
                    toast.success('New host name added');
                    $scope.sniList.push(targetInput.val());

                    targetInput.val('');

                }, function (response) {
                    toast.error(response.data);
                });
            });

            angular.element('span#btnAddTarget').on('click', function () {
                formTarget.slideToggle(300);
            });

        }]);

})(window.angular, app);