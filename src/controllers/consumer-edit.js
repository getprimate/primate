/* global app:true */
(function (angular, app) { 'use strict';
    const controller = 'ConsumerEditController';
    if (typeof app === 'undefined') throw (controller + ': app is undefined');

    app.controller(controller, ['$window', '$scope', '$routeParams', 'ajax', 'viewFactory', 'toast',
        function ($window, $scope, $routeParams, ajax, viewFactory, toast) {

        viewFactory.title = 'Edit Consumer';

        $scope.consumerId = $routeParams.consumerId;
        $scope.formInput = {};
        $scope.authMethods = {};

        $scope.fetchAuthList = function (authName, dataModel) {
            ajax.get({ resource: '/consumers/' + $scope.consumerId + '/' + authName }).then(function (response) {
                $scope.authMethods[dataModel]  = response.data.data;

            }, function () {
                toast.error('Could not load authentication details');
            });
        };

        ajax.get({ resource: '/consumers/' + $scope.consumerId }).then(function (response) {
            $scope.formInput.username = response.data.username;
            $scope.formInput.custom_id = response.data.custom_id;

            viewFactory.deleteAction = { target: 'consumer', url: '/consumers/' + $scope.consumerId, redirect: '#!/consumers' };

        }, function () {
            toast.error('Could not load consumer details');
            $window.location.href = '#!/consumers';
        });

        let consumerEditForm = angular.element('form#consumerEditForm'),
            authNotebook = angular.element('#authNotebook.notebook'),
            authName = 'key-auth',
            dataModel = 'keyAuthList';

        consumerEditForm.on('submit', function (event) {
            event.preventDefault();

            ajax.patch({
                resource: '/consumers/' + $scope.consumerId + '/',
                data: $scope.formInput
            }).then(function () {
                toast.success('Consumer updated');

            }, function (response) {
                toast.error(response.data);
            });

            return false;
        });

        authNotebook.on('click', '.col.tab', function (event) {
            let tab = angular.element(event.target);
            let targetView = authNotebook.find(tab.data('target-view'));

            authNotebook.children('.row').children('.tab').removeClass('active');
            tab.addClass('active');

            authNotebook.find('.auth-view:visible').hide({ duration:300, direction: 'left' });
            targetView.show({ duration:300, direction:'right' });

            dataModel = targetView.data('list-model');
            authName  = targetView.data('auth-name');

            if (typeof $scope.authMethods[dataModel] === 'undefined' || $scope.authMethods[dataModel].length <= 0) {
                $scope.fetchAuthList(authName, dataModel);
            }
        }).on('click', 'button.btn.cancel', function (event) {
            angular.element(event.target).parents('form.form-new-auth').slideUp(300);

        }).on('click', '.toggle-form', function (event) {
            angular.element(event.target).parents('.auth-view').find('form.form-new-auth').slideToggle(300);

        }).on('submit', 'form.form-new-auth', function (event) {
            event.preventDefault();

            let form = angular.element(event.target), payload = {};

            form.find('input.param').each(function (index, element) {
                payload[element.name] = element.value;
            });

            ajax.post({
                resource: '/consumers/' + $scope.consumerId + '/' + authName,
                data: payload
            }).then(function (response) {
                $scope.authMethods[dataModel].push(response.data);
                toast.success('Authentication saved');

            }, function (response) {
                toast.error(response.data);
            });

            return false;
        });

        $scope.fetchAuthList('key-auth', 'keyAuthList');
    }]);

})(window.angular, app);