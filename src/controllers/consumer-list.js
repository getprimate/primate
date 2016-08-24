app.controller('ConsumerListController', ['$scope', '$http', '$httpParamSerializerJQLike', 'viewFactory', 'toast',
    function ($scope, $http, $httpParamSerializerJQLike, viewFactory, toast) {

    $scope.formInput = {
        userName: '',
        customId: ''
    };

    viewFactory.title = 'Consumer List'
    viewFactory.prevUrl = viewFactory.deleteAction = null

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

        if ($scope.formInput.customId.trim().length > 1) {
            payload.custom_id = $scope.formInput.customId;
        }

        if (typeof payload.username === 'undefined' &&
            typeof payload.custom_id === 'undefined') {
            consumerForm.find('input[name="userName"]').focus();
            return false;
        }

        $http({
            method: 'POST',
            url: buildUrl('/consumers/'),
            data: $httpParamSerializerJQLike(payload),
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        }).then((response) => {
            $scope.consumersList.push(response.data);
            toast.success('Added new consumer');

        }, (response) => {
            if (response.status == 401) toast.error('Duplicate value for one of the consumer properties');
            else toast.error('Could not add new consumer');
        });

        return false;
    });

    consumerForm.on('click', 'button[name="actionCancel"]', function () {
        consumerForm.slideUp(300);
    });

    $http({
        method: 'GET',
        url: buildUrl('/consumers')
    }).then((response) => {
        $scope.consumersList = response.data.data;

    }, () => {
        toast.error('Could not load list of consumers');
    });
}]);