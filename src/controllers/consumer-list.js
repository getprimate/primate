(function (angular, app) {

    var controller = 'ConsumerListController';

    if (typeof app === 'undefined') {
        throw ( controller + ': app is undefined');
    }

    app.controller(controller, ['$scope', 'ajax', 'viewFactory', 'toast', function ($scope, ajax, viewFactory, toast) {
        $scope.formInput = {
            userName: '',
            custom_id: ''
        };

        $scope.consumerList = [];

        $scope.fetchConsumerList = function (url) {
            ajax.get({
                resource: url
            }).then(function (response) {
                $scope.nextUrl = response.data.next || '';

                for (var i=0; i<response.data.data.length; i++ ) {
                    $scope.consumerList.push(response.data.data[i]);
                }

            }, function () {
                toast.error('Could not load list of consumers');
            });
        };

        viewFactory.title = 'Consumer List';
        viewFactory.prevUrl = null;

        var panelAdd = angular.element('div#panelAdd');
        var consumerForm = panelAdd.children('div.panel__body').children('form');

        var table = angular.element('table#consumersTable');

        panelAdd.children('div.panel__heading').on('click', function () {
            consumerForm.slideToggle(300);
        });

        consumerForm.on('submit', function (event) {
            event.preventDefault();

            var payload = {};

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

        $scope.fetchConsumerList('/consumers')
    }]);
})(window.angular, app);