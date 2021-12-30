/* global app:true */
(function (angular, app) { 'use strict';
    const controller = 'ConsumerListController';
    if (typeof app === 'undefined') throw (controller + ': app is undefined');

    app.controller(controller, ['$scope', 'ajax', 'viewFrame', 'toast', function ($scope, ajax, viewFrame, toast) {
        viewFrame.title = 'Consumer List';
        viewFrame.prevUrl = '';

        $scope.consumerList = [];
        $scope.formInput = {
            userName: '',
            custom_id: ''
        };

        $scope.fetchConsumerList = function (resource) {
            ajax.get({ resource: resource }).then(function (response) {
                $scope.nextUrl = (typeof response.data.next === 'string') ?
                    response.data.next.replace(new RegExp(viewFrame.host), '') : '';

                for (let index = 0; index < response.data.data.length; index++) {
                    $scope.consumerList.push(response.data.data[index]);
                }

            }, function () {
                toast.error('Could not load list of consumers');
            });
        };

        let panelAdd = angular.element('div#panelAdd');
        let consumerForm = panelAdd.children('div.panel__body').children('form');

        panelAdd.children('div.panel__heading').on('click', function () {
            consumerForm.slideToggle(300);
        });

        consumerForm.on('submit', function (event) {
            event.preventDefault();

            let payload = {};

            if ($scope.formInput.userName.trim().length > 1) {
                payload.username = $scope.formInput.userName;
            }

            if ($scope.formInput.custom_id.trim().length > 1) {
                payload.custom_id = $scope.formInput.custom_id;
            }

            if (typeof payload.username === 'undefined' &&
                typeof payload.custom_id === 'undefined') {
                consumerForm.find('input[name="userName"]').focus();
                return false;
            }

            ajax.post({
                resource: '/consumers/',
                data: payload
            }).then(function(response) {
                $scope.consumerList.push(response.data);
                toast.success('Added new consumer');

            }, function (response) {
                toast.error(response.data);
            });

            return false;
        });

        consumerForm.on('click', 'button[name="actionCancel"]', function () {
            consumerForm.slideUp(300);
        });

        $scope.fetchConsumerList('/consumers');
    }]);
})(window.angular, app);