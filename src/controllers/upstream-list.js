/* global app:true */
((angular, app) => { 'use strict';
    const controller = 'UpstreamListController';

    if (typeof app === 'undefined') throw (controller + ': app is undefined');

    app.controller(controller, ['$scope', 'ajax', 'viewFactory', 'toast', function ($scope, ajax, viewFactory, toast) {
        $scope.formInput = {
            hostname: '',
            slots: '',
            orderList: ''
        };

        $scope.upstreamList = [];

        $scope.fetchUpstreamList = (resource) => {
            ajax.get({ resource: resource }).then((response) => {
                $scope.nextUrl = response.data.next || '';

                for (let i = 0; i < response.data.data.length; i++ ) {
                    $scope.upstreamList.push(response.data.data[i]);
                }

            }, () => {
                toast.error('Could not load upstreams');
            });
        };

        viewFactory.title = 'Upstreams';
        viewFactory.prevUrl = null;

        var panelAdd = angular.element('div#panelAdd');
        var formUpstream = panelAdd.children('div.panel__body').children('form');

        panelAdd.children('div.panel__heading').on('click', () => {
            formUpstream.slideToggle(300);
        });

        formUpstream.on('submit', (event) => {
            event.preventDefault();

            var payload = {};

            if ($scope.formInput.hostname.trim().length > 10) {
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
                    toast.error('Invalid order list!!!');
                }
            }

            ajax.post({
                resource: '/upstreams/',
                data: payload
            }).then((response) => {
                $scope.upstreamList.push(response.data);
                toast.success('Upstream added');

            }, (response) => {
                alert(payload);
                toast.error(response.data);
            });

            return false;
        });

        formUpstream.on('click', 'button[name="actionCancel"]', () => {
            formUpstream.slideUp(300);
        });

        $scope.fetchUpstreamList('/upstreams/');
    }]);

})(window.angular, app);