/* global app:true */
(function(angular, app) { 'use strict';
    const controller = 'UpstreamListController';

    if (typeof app === 'undefined') throw (controller + ': app is undefined');

    app.controller(controller, ['$scope', 'ajax', 'viewFactory', 'toast', function ($scope, ajax, viewFactory, toast) {
        viewFactory.title = 'Upstreams';
        viewFactory.prevUrl = null;

        $scope.upstreamList = [];
        $scope.formInput = {
            hostname: '',
            slots: '',
            orderList: ''
        };

        $scope.fetchUpstreamList = function (resource) {
            ajax.get({ resource: resource }).then(function (response) {

                $scope.nextUrl = (typeof response.data.next === 'string') ?
                    response.data.next.replace(new RegExp(viewFactory.host), '') : '';

                for (let index = 0; index < response.data.data.length; index++ ) {
                    $scope.upstreamList.push(response.data.data[index]);
                }

            }, function () {
                toast.error('Could not load upstreams');
            });
        };

        let panelAdd = angular.element('div#panelAdd');
        let formUpstream = panelAdd.children('div.panel__body').children('form');

        panelAdd.children('div.panel__heading').on('click', function () {
            formUpstream.slideToggle(300);
        });

        formUpstream.on('submit', function (event) {
            event.preventDefault();

            let payload = {};

            if ($scope.formInput.hostname.trim().length > 0) {
                payload.name = $scope.formInput.hostname;

            } else {
                formUpstream.find('input[name="hostname"]').focus();
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

            ajax.post({
                resource: '/upstreams/',
                data: payload
            }).then(function (response) {
                $scope.upstreamList.push(response.data);
                toast.success('Upstream added');

            }, function (response) {
                toast.error(response.data);
            });

            return false;
        });

        formUpstream.on('click', 'button[name="actionCancel"]', function () {
            formUpstream.slideUp(300);
        });

        $scope.fetchUpstreamList('/upstreams/');
    }]);
})(window.angular, app);