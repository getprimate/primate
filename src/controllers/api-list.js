/* global app:true */
(function (angular, app) { 'use strict';

    const controller = 'ApiListController';
    if (typeof app === 'undefined') throw (controller + ': app is undefined');

    app.controller(controller, ['$scope', 'ajax', 'toast', 'viewFactory', function ($scope, ajax, toast, viewFactory) {
        viewFactory.title = 'API List';
        viewFactory.prevUrl = null;

        $scope.formInput = {
            name: '',
            methods: '',
            hosts: '',
            uris: '',
            upstreamUrl: '',
            retries: '',
            connectTimeout: '',
            sendTimeout: '',
            readTimeout: '',
            preserveHost: false,
            stripUri: true,
            httpsOnly: false,
            httpIfTerminated: true
        };

        $scope.apiList = [];
        $scope.fetchApiList = function (resource) {
            ajax.get({ resource: resource }).then(function (response) {
                $scope.nextUrl = (typeof response.data.next === 'string') ?
                    response.data.next.replace(new RegExp(viewFactory.host), '') : '';
                angular.element(document.querySelector(".spinner")).remove();
                for (let index = 0; index < response.data.data.length; index++) {
                    $scope.apiList.push(response.data.data[index]);
                }

            }, function () {
                toast.error('Could not load list of APIs');
            });
        };

        let panelAdd = angular.element('div#panelAdd');
        let apiForm = panelAdd.children('div.panel__body').children('form');

        let table = angular.element('table#apiTable');

        table.on('click', 'i.state-highlight', function (event) {
            let icon = angular.element(event.target);
            let payload = {};
            let attribute = icon.data('attribute');

            payload[attribute] = !(icon.hasClass('success'));

            ajax.patch({
                resource: '/apis/' + icon.data('api-id'),
                data: payload
            }).then(function () {
                if (payload[attribute] === true) {
                    icon.removeClass('default').addClass('success');

                } else {
                    icon.removeClass('success').addClass('default');
                }

                toast.success('Attribute ' + attribute + ' set to ' + payload[attribute]);

            }, function () {
                toast.error('Unable to update ' + attribute);
            });
        });

        panelAdd.children('div.panel__heading').on('click', function () {
            apiForm.slideToggle(300);
        });

        apiForm.on('submit', function (event) {
            event.preventDefault();

            let payload = {};

            if ($scope.formInput.name.trim().length > 1) {
                payload.name = $scope.formInput.name;

            } else {
                apiForm.find('input[name="apiName"]').focus();
                return false;
            }

            if ($scope.formInput.hosts.trim().length > 1) {
                payload.hosts = $scope.formInput.hosts;
            }

            if ($scope.formInput.uris.trim().length > 1) {
                payload.uris = $scope.formInput.uris;
            }

            if ($scope.formInput.methods.trim().length > 1) {
                payload.methods = $scope.formInput.methods;
            }

            if (typeof payload.hosts === 'undefined'
                && typeof payload.uris === 'undefined'
                && typeof payload.methods === 'undefined') {
                apiForm.find('input[name="hosts"]').focus();
                return false;
            }

            if ($scope.formInput.upstreamUrl.trim().length > 1) {
                payload.upstream_url = $scope.formInput.upstreamUrl;

            } else {
                apiForm.find('input[name="upstreamUrl"]').focus();
                return false;
            }

            payload.retries = (isNaN($scope.formInput.retries) || !$scope.formInput.retries) ?
                5 : parseInt($scope.formInput.retries);

            payload.upstream_connect_timeout = (isNaN($scope.formInput.connectTimeout) || !$scope.formInput.connectTimeout) ?
                60000 : parseInt($scope.formInput.connectTimeout);

            payload.upstream_send_timeout = (isNaN($scope.formInput.sendTimeout) || !$scope.formInput.sendTimeout) ?
                60000 : parseInt($scope.formInput.sendTimeout);

            payload.upstream_read_timeout = (isNaN($scope.formInput.readTimeout) || !$scope.formInput.readTimeout) ?
                60000 : parseInt($scope.formInput.readTimeout);

            payload.strip_uri = $scope.formInput.stripUri;
            payload.preserve_host = $scope.formInput.preserveHost;
            payload.https_only = $scope.formInput.httpsOnly;
            payload.http_if_terminated = $scope.formInput.httpIfTerminated;

            ajax.post({
                resource: '/apis/',
                data: payload
            }).then(function (response) {
                $scope.apiList.push(response.data);

                toast.success('New API \'' + payload.name + '\' added');

            }, function (response) {
                toast.error(response.data);
            });

            return false;
        });

        apiForm.on('click', 'button[name="actionCancel"]', function () {
            apiForm.slideUp(300);
        });

        $scope.fetchApiList('/apis?size=10000');

        let searchBox = angular.element('#search > .typeahead');

        let origList = $scope.apiList;

        searchBox.on('keyup',(el)=>{
            let reg = new RegExp(el.target.value);
            $scope.apiList = origList.filter((api) => {
                return reg.test(api.name);
            });
            $scope.$apply();
        });
    }]);

})(window.angular, app);


