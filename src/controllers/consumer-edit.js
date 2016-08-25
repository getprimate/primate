app.controller('ConsumerEditController', ['$scope', '$routeParams', '$http', 'viewFactory', 'toast',
    function ($scope, $routeParams, $http, viewFactory, toast) {

    $scope.consumerId = $routeParams.consumerId;
    $scope.formInput = {};

    $scope.authMethods = {};

    viewFactory.title = 'Edit Consumer';
    viewFactory.deleteAction = { target: 'consumer', url: '/consumers/' + $scope.consumerId };

    $scope.fetchAuthList = function (authName, dataModel) {
        $http({
            method: 'GET',
            url: buildUrl('/consumers/' + $scope.consumerId + '/' + authName)
        }).then(function (response) {
            $scope.authMethods[dataModel]  = response.data.data

        }, function () {
            toast.error('Could not load authentication details')
        })
    };

    $http({
        method: 'GET',
        url: buildUrl('/consumers/' + $scope.consumerId)
    }).then(function (response) {
        $scope.formInput.username = response.data.username;
        $scope.formInput.customId = response.data.custom_id;
    }, function () {
        toast.error('Could not load consumer details');
    });

    var authNotebook = angular.element('#authNotebook.notebook');

    let authName, dataModel;
    authNotebook.on('click', '.col.tab', function (event) {
        var tab = angular.element(event.target);
        var targetView = authNotebook.find(tab.data('target-view'));

        authNotebook.children('.row').children('.tab').removeClass('active');
        tab.addClass('active');

        authNotebook.find('.auth-view:visible').hide({ duration:300, direction: 'left' });
        targetView.show({ duration:300, direction:'right' });

        dataModel = targetView.data('list-model');
        authName  = targetView.data('auth-name');

        if (typeof $scope.authMethods[dataModel] == 'undefined' || $scope.authMethods[dataModel].length <= 0) {
            $scope.fetchAuthList(authName, dataModel);
        }
    }).on('click', 'button.btn.cancel', function (event) {
        angular.element(event.target).parents('form.form-new-auth').slideUp(300);

    }).on('click', '.toggle-form', function (event) {
        angular.element(event.target).parents('.auth-view').find('form.form-new-auth').slideToggle(300);

    }).on('submit', 'form.form-new-auth', function (event) {
        var form = angular.element(event.target);
        var payload = {};

        form.find('input.param').each(function (index, element) {
            var name = element.name;
            payload[name] = element.value;
        });

        $http({
            method: 'POST',
            url: buildUrl('/consumers/' + $scope.consumerId + '/' + authName),
            data: payload,
            headers: {'Content-Type': 'application/json'}
        }).then(function (response) {
            $scope.authMethods[dataModel].push(response.data);
            toast.success('Authentication saved');

        }, function () {
            toast.error('Could not add new authentication');
        });
    });

    $scope.fetchAuthList('key-auth', 'keyAuthList');
}]);