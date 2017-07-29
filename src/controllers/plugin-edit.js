/* global app:true */
(function (angular, app) { 'use strict';
    const controller = 'PluginEditController';
    if (typeof app === 'undefined') throw (controller + ': app is undefined');

    app.controller(controller, ['$window', '$scope', '$routeParams', 'ajax', 'viewFactory', 'toast',
        function ($window, $scope, $routeParams, ajax, viewFactory, toast) {

        let action = 'create';

        $scope.fetchSchema = function (plugin, callback) {
            $scope.checkBoxes = {};

            ajax.get({ resource: '/plugins/schema/' + plugin }).then(function (response) {
                $scope.pluginSchema = response.data;

                angular.forEach($scope.pluginSchema.fields, function (value, key) {
                    if (value.type === 'array' && typeof value.enum !== 'undefined') {
                        $scope.checkBoxes[key] = {};

                        for (let i = 0; i < value.enum.length; i++) {
                            $scope.checkBoxes[key][value.enum[i]] = false;
                        }
                    } else if (typeof value.default !== 'undefined') {
                        $scope.formInput.config[key] = value.default;
                    }
                });

                if (typeof callback === 'function') {
                    callback(response);
                }

            }, function () {
                toast.error('Could not fetch ' + plugin + ' plugin schema');
            });
        };

        $scope.newCustomForm = function(field, schema) {
            if (!$scope.flexTableObj[field] || $scope.flexTableObj[field] === '') {
                return;
            }

            if (!$scope.formInput.config[field]) {
                $scope.formInput.config[field] = {};
            }

            $scope.formInput.config[field][$scope.flexTableObj[field]] = {};

            angular.forEach(schema, function(fieldAttrs, fieldName) {
                $scope.formInput.config[field][$scope.flexTableObj[field]][fieldName] = (fieldAttrs.default ? fieldAttrs.default : '');
            });

            $scope.flexTableObj[field] = '';
        };

        $scope.removeCustomForm = function(field, subField) {
            if ($scope.formInput.config[field][subField]) {
                delete $scope.formInput.config[field][subField];
            }
        };

        ajax.get({
            resource: '/plugins/enabled'
        }).then(function (response) {
            $scope.enabledPlugins = response.data.enabled_plugins;

        }, function () {
            toast.error('Could not fetch list of enabled plugins');
        });

        ajax.get({ resource: '/consumers' }).then(function (response) {
            $scope.consumerList = response.data.data;

        }, function () {
            toast.warning('Could not fetch list of consumers');
        });

        $scope.apiId = $routeParams.apiId;
        $scope.formInput = { config:{} };
        $scope.flexTableObj = {};

        let pluginForm = angular.element('form#editPlugins');

        pluginForm.on('submit', function (event) {
            event.preventDefault();

            angular.forEach($scope.checkBoxes, function (value, key) {
                $scope.formInput.config[key] = [];

                if (typeof value !== 'object') return;

                angular.forEach(value, function (flag, eName) {
                    if (flag === true) $scope.formInput.config[key].push(eName);
                });
            });

            if ( $scope.pluginSchema.no_consumer ) {
                if (typeof $scope.formInput.consumer_id !== 'undefined')
                    delete $scope.formInput.consumer_id;

            } else {
                if (typeof $scope.formInput.consumer_id !== 'undefined' && !$scope.formInput.consumer_id)
                    delete $scope.formInput.consumer_id;
            }

            let config = {
                method: '',
                url: '',
                data: $scope.formInput,
                headers: {'Content-Type': 'application/json'}
            };

            if (action === 'create') {
                config.method = 'POST';
                config.resource = '/apis/' + $scope.apiId + '/plugins/';

            } else if (action === 'update') {
                config.method = 'PATCH';
                config.resource = '/apis/' + $scope.apiId + '/plugins/' + $scope.pluginId;
            }

            ajax.request(config).then(function () {
                toast.success('Plugin ' + action + 'd');

            }, function (response) {
                toast.error(response.data);
            });
        }).on('click', 'button.add-flex-table', function (event) {
            let parent = angular.element(event.target).parent('div');
            let objName = parent.children('input[type="text"]').val();

            if (!objName) return;

            parent.append(angular.element('<div></div>', { 'data-ng-include': '\'views/plugin-flexible-table.html\'' }));
        });

        if (typeof $routeParams.pluginId === 'string') {
            $scope.pluginId = $routeParams.pluginId;
            action = 'update';

            ajax.get({ resource: '/plugins/' + $scope.pluginId }).then(function (response) {
                $scope.apiId = response.data.api_id;

                $scope.fetchSchema(response.data.name, function () {
                    $scope.formInput.consumer_id = response.data.consumer_id || null;
                    $scope.formInput.name = response.data.name;
                    $scope.formInput.config = response.data.config;

                    angular.forEach($scope.checkBoxes, function (value, key) {
                        let enumList = response.data.config[key];

                        for (let i = 0; i < enumList.length; i++) {
                            $scope.checkBoxes[key][enumList[i]] = true;
                        }
                    });
                });


                viewFactory.title = 'Edit ' + response.data.name + ' Plugin';
                viewFactory.deleteAction = { target: 'plugin', url: '/apis/' + $scope.apiId + '/plugins/' + $scope.pluginId };

            }, function () {
                toast.error('Could not fetch plugin details');
                $window.location.href = '#!/api';
            });

        } else {
            action = 'create';

            viewFactory.prevUrl = '#!/api/' + $scope.apiId;
            viewFactory.title = 'Add New Plugin';

            pluginForm.on('change', 'select[name="name"]', function (event) {
                $scope.formInput = { name: event.target.value, config:{} };
                $scope.fetchSchema(event.target.value);
            });
        }

        $scope.prevUrl = viewFactory.prevUrl;
    }]);

})(window.angular, app);