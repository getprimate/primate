/* global app:true */
(function (angular, app) { 'use strict';
    const controller = 'UpstreamEditController';
    if (typeof app === 'undefined') throw (controller + ': app is undefined');

    app.controller(controller, ['$window', '$scope', '$routeParams', '$http', 'viewFactory', 'toast', function ($window, scope, routeParams, http, viewFactory, toast) {

        scope.ENUM_ALGORITHMS = ['consistent-hashing', 'least-connections', 'round-robin'];
        scope.ENUM_HASH_INPUTS = ['none', 'consumer', 'ip', 'header', 'cookie'];
        scope.ENUM_PROTOCOL = ['http', 'https', 'grpc', 'grpcs', 'tcp'];

        scope.targetList = [];
        scope.upstreamModel = {
            name: '',
            algorithm: 'round-robin',
            hash_on: 'none',
            hash_fallback: 'none',
            hash_on_cookie_path: '',
            slots: 10000,
            healthchecks: {
                passive: {
                    type: 'http',
                    healthy: {
                        successes: 5,
                        http_statuses: [200, 201, 202, 203, 204, 205, 206, 207, 208, 226, 300, 301, 302, 303, 304, 305, 306, 307, 308]
                    },
                    unhealthy: {
                        tcp_failures: 2,
                        http_statuses: [429, 500, 503],
                        http_failures: 2,
                        timeouts: 5
                    }
                },
                active: {
                    http_path: '/',
                    timeout: 1,
                    concurrency: 10,
                    https_sni: 'example.com',
                    type: 'http',
                    healthy: {
                        interval: 0,
                        http_statuses: [200, 302],
                        successes: 0
                    },
                    https_verify_certificate: true,
                    unhealthy: {
                        tcp_failures: 0,
                        http_statuses: [429, 404, 500, 501, 502, 503, 504, 505],
                        http_failures: 0,
                        interval: 0,
                        timeouts: 0
                    }
                },
                threshold: 0
            },
            tags: ['user-level', 'low-priority'],
            host_header: 'example.com',
            client_certificate: ''
        };

        switch (routeParams.upstreamId) {
            case 'create':
                viewFactory.title = 'Create Upstream';
                break;

            default:
                viewFactory.title = 'Edit Upstream';
                scope.upstreamId = routeParams.upstreamId;
                break;
        }

        /*
        $scope.fetchTargetList = function (url) {
            ajax.get({ resource: url }).then(function (response) {
                $scope.nextTargetUrl = (typeof response.data.next === 'string') ?
                    response.data.next.replace(new RegExp(viewFactory.host), '') : '';

                for (let index = 0; index < response.data.data.length; index++) {
                    $scope.targetList.push(response.data.data[index]);
                }

            }, function () {
                toast.error('Could not load targets');
            });
        };
        */

        /*
        ajax.get({ resource: '/upstreams/' + $scope.upstreamId }).then(function (response) {
            $scope.formInput.hostname = response.data.name;
            $scope.formInput.slots = response.data.slots;

            $scope.formInput.orderList = (typeof response.data.orderlist === 'object'
                && Array.isArray(response.data.orderlist)) ? response.data.orderlist.join() : '';

            viewFactory.deleteAction = {target: 'Upstream', url: '/upstreams/' + $scope.upstreamId, redirect: '#!/upstreams'};

        }, function () {
            toast.error('Could not load upstream details');
            $window.location.href = '#!/upstreams';
        });

        let formEdit = angular.element('form#formEdit'), formTarget = angular.element('form#formTarget');

        formEdit.on('submit', function (event) {
            event.preventDefault();

            let payload = {};

            if ($scope.formInput.hostname.trim().length > 0) {
                payload.name = $scope.formInput.hostname;

            } else {
                formEdit.find('input[name="hostname"]').focus();
                return false;
            }

            payload.slots = (isNaN($scope.formInput.slots) || !$scope.formInput.slots) ?
                1000 : parseInt($scope.formInput.slots);

            if ($scope.formInput.orderList !== null && $scope.formInput.orderList.trim().length > 0) {
                payload.orderlist = [];

                try {
                    let split = $scope.formInput.orderList.split(','), e;
                    for (let index in split) {
                        e = parseInt(split[index].trim());

                        if (isNaN(e)) {
                            toast.error('Invalid number ' + split[index] + ' in order list');
                            return false;
                        }

                        payload.orderlist.push(e);
                    }
                } catch (e) {
                    toast.error('Invalid order list');
                }
            }

            ajax.patch({
                resource: '/upstreams/' + $scope.upstreamId,
                data: payload
            }).then(function () {
                toast.success('Upstream updated');

            }, function (response) {
                toast.error(response.data);
            });

            return false;
        });
        */

        /*
        formTarget.on('submit', function (event) {
            event.preventDefault();

            let targetInput = formTarget.children('div.hpadding-10.pad-top-10').children('input[name="target"]');
            let payload = {};

            if (null === targetInput.val() || targetInput.val().trim().length <= 0) {
                return false;
            }

            let tgArray = targetInput.val().split(',');

            payload.target = tgArray[0] || '';
            payload.weight = (!tgArray[1] || isNaN(tgArray[1])) ? 100 : parseInt(tgArray[1]);

            ajax.post({
                resource: '/upstreams/' + $scope.upstreamId + '/targets',
                data: payload
            }).then(function (response) {
                toast.success('New target added');
                $scope.targetList.push({
                    target: payload.target,
                    weight: payload.weight,
                    id: response.data.id
                });

                targetInput.val('');

            }, function (response) {
                toast.error(response.data);
            });
        });

        $scope.fetchTargetList('/upstreams/' + $scope.upstreamId + '/targets');
        */

        const formEdit = angular.element('form#formEdit'), formTarget = angular.element('form#formTarget');

        angular.element('span#btnAddTarget').on('click', function () {
            formTarget.slideToggle(300);
        });
    }]);
})(window.angular, app);