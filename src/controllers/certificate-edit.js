/* global app:true */
(function (angular, app) { 'use strict';

    const controller = 'CertificateEditController';
    if (typeof app === 'undefined') throw (controller + ': app is undefined');

    app.controller(controller, ['$window', '$scope', '$routeParams', 'ajax', 'viewFactory', 'toast',
        function ($window, $scope, $routeParams, ajax, viewFactory, toast) {

        viewFactory.title = 'Edit Certificate';

        $scope.certId = $routeParams.certificateId;
        $scope.formInput = {};
        $scope.sniList = [];

        ajax.get({ resource: '/certificates/' + $scope.certId }).then(function (response) {
            $scope.formInput.certificate = response.data.cert;
            $scope.formInput.privateKey = response.data.key;

            $scope.sniList = (typeof response.data.snis === 'object'
                && Array.isArray(response.data.snis)) ? response.data.snis : [];

            viewFactory.deleteAction = {
                target: 'Certificate',
                url: '/certificates/' + $scope.certId,
                redirect: '#!/certificates'
            };

        }, function () {
            toast.error('Could not load certificate details');
            $window.location.href = '#!/certificates';
        });

        let formEdit = angular.element('form#formEdit'), formSNIs = angular.element('form#formSNIs');

        formEdit.on('submit', function (event) {
            event.preventDefault();

            let payload = {};

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
            }).then(function() {
                toast.success('Certificate updated');

            }, function (response) {
                toast.error(response.data);
            });

            return false;
        });

        formSNIs.on('submit', function (event) {
            event.preventDefault();

            let hostInput = formSNIs.children('div.hpadding-10.pad-top-10').children('input[name="host"]');
            let payload = {};

            if (hostInput.val().trim().length <= 0) {
                return false;
            }

            payload.name = hostInput.val();
            payload.ssl_certificate_id = $scope.certId;

            ajax.post({
                resource: '/snis/',
                data: payload
            }).then(function () {
                toast.success('New host name added');
                $scope.sniList.push(hostInput.val());

                hostInput.val('');

            }, function (response) {
                toast.error(response.data);
            });
        });

        angular.element('span#btnAddSNI').on('click', function () {
            formSNIs.slideToggle(300);
        });

    }]);
})(window.angular, app);