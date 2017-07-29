/* global app:true */
((angular, app) => { 'use strict';
    const controller = 'UpstreamEditController';

    if (typeof app === 'undefined') throw (controller + ': app is undefined');

    app.controller(controller, ['$scope', '$routeParams', 'ajax', 'viewFactory', 'toast',
        function ($scope, $routeParams, ajax, viewFactory, toast) {
        
        $scope.upstreamId = $routeParams.upstreamId;
        $scope.formInput = {
            hostname: '',
            slots: '',
            orderList: ''
        };
        $scope.targetList = [];

        $scope.fetchTargetList = function (url) {
            ajax.get({ resource: url }).then(function (response) {
                $scope.nextTargetUrl = response.data.next || '';

                for (let index = 0; index < response.data.data.length; index++) {
                    $scope.targetList.push(response.data.data[index]);
                }

            }, function () {
                toast.error('Could not load targets');
            });
        };

        viewFactory.title = 'Edit Upstream';

        ajax.get({ resource: '/upstreams/' + $scope.upstreamId }).then(function (response) {
            $scope.formInput.hostname = response.data.name;
            $scope.formInput.slots = response.data.slots;

            $scope.formInput.orderList = (typeof response.data.orderlist === 'object'
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

            if ($scope.formInput.hostname.trim().length > 10) {
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
            }).then(() => {
                toast.success('Upstream updated');

            }, (response) => {
                toast.error(response.data);
            });

            return false;
        });

        formTarget.on('submit', (event) => {
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

        angular.element('span#btnAddTarget').on('click', function () {
            formTarget.slideToggle(300);
        });

        $scope.fetchTargetList('/upstreams/' + $scope.upstreamId + '/targets');
    }]);

})(window.angular, app);