app.controller('PluginEditController', ['$scope', '$routeParams', '$http', 'viewFactory', 'toast',
    function ($scope, $routeParams, $http, viewFactory, toast) {

    var action = 'create';

    $scope.fetchSchema = function (plugin, callback) {
        $http({
            method: 'GET',
            url: buildUrl('/plugins/schema/' + plugin)
        }).then(function (response) {
            $scope.pluginSchema = response.data;

            angular.forEach($scope.pluginSchema.fields, function (value, key) {
                if (value.type == 'array' && typeof value.enum != 'undefined') {
                    $scope.checkBoxes[key] = {};

                    for (i=0; i<value.enum.length; i++) {
                        $scope.checkBoxes[key][value.enum[i]] = false;
                    }
                } else if (typeof value.default != 'undefined') {
                    $scope.formInput.config[key] = value.default;
                }
            });

            if (typeof callback == 'function') {
                callback(response);
            }

        }, function () {
            toast.error('Could not fetch ' + plugin + ' plugin schema');
        });
    };

    $scope.newCustomForm = function(field, schema) {
        if (!$scope.flexTableObj[field] || $scope.flexTableObj[field] == '') {
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

    $http({
        method: 'GET',
        url: buildUrl('/plugins/enabled')
    }).then(function (response) {
        $scope.enabledPlugins = response.data.enabled_plugins;

    }, function () {
        toast.error('Could not fetch list of enabled plugins');
    });

    $http({
        method: 'GET',
        url: buildUrl('/consumers')
    }).then(function (response) {
        $scope.consumerList = response.data.data;

    }, function () {
        toast.warning('Could not fetch list of consumers');
    });

    $scope.apiId = $routeParams.apiId;
    $scope.formInput = { config:{} };
    $scope.checkBoxes = {};
    $scope.flexTableObj = {};

    var pluginForm = angular.element('form#editPlugins');

    pluginForm.on('submit', function (event) {
        event.preventDefault();

        angular.forEach($scope.checkBoxes, function (value, key) {
            $scope.formInput.config[key] = [];

            if (typeof value != 'object') return;

            angular.forEach(value, function (flag, eName) {
                if (flag === true) $scope.formInput.config[key].push(eName)
            });
        });

        if ( $scope.pluginSchema.no_consumer ) {
            if (typeof $scope.formInput.consumer_id != 'undefined')
                delete $scope.formInput.consumer_id

        } else {
            if (typeof $scope.formInput.consumer_id != 'undefined' && !$scope.formInput.consumer_id)
                delete $scope.formInput.consumer_id
        }

        var config = {
            method: '',
            url: '',
            data: $scope.formInput,
            headers: {'Content-Type': 'application/json'}
        };

        if (action === 'create') {
            config.method = 'POST';
            config.url = buildUrl('/apis/' + $scope.apiId + '/plugins/')

        } else if (action === 'update') {
            config.method = 'PATCH';
            config.url = buildUrl('/apis/' + $scope.apiId + '/plugins/' + $scope.pluginId)
        }

        $http(config).then(function () {
            toast.success('Plugin ' + action + 'd');
            pluginForm.find('.btn.cancel').click();

        }, function (response) {
            toast.error(response.data.message || JSON.stringify(response.data));
        });
    }).on('click', 'button.add-flex-table', function (event) {
        var parent = angular.element(event.target).parent('div');
        var objName = parent.children('input[type="text"]').val();

        if (!objName) return;

        parent.append(angular.element('<div></div>', { 'data-ng-include': "'views/plugin-flexible-table.html'" }));
    });

    if (typeof $routeParams.pluginId === 'string') {
        $scope.pluginId = $routeParams.pluginId;
        action = 'update';

        $http({
            method: 'GET',
            url: buildUrl('/plugins/' + $scope.pluginId)
        }).then(function (response) {
            $scope.apiId = response.data.api_id;

            $scope.fetchSchema(response.data.name, function () {
                $scope.formInput.consumer_id = response.data.consumer_id || null;
                $scope.formInput.name = response.data.name;
                $scope.formInput.config = response.data.config;

                angular.forEach($scope.checkBoxes, function (value, key) {
                    var enumList = response.data.config[key];

                    for (i=0; i<enumList.length; i++) {
                        $scope.checkBoxes[key][enumList[i]] = true
                    }
                })
            });

            viewFactory.prevUrl = '#/api/' + $scope.apiId;
            viewFactory.title = 'Edit ' + response.data.name + ' Plugin';
            viewFactory.deleteAction = {target: 'plugin', url: '/apis/' + $scope.apiId + '/plugins/' + $scope.pluginId};

        }, function () {
            toast.error('Could not fetch plugin details');
        })

    } else {
        action = 'create';

        viewFactory.prevUrl = '#/api/' + $scope.apiId;
        viewFactory.title = 'Add New Plugin';
        viewFactory.deleteAction = null;

        pluginForm.on('change', 'select[name="name"]', function (event) {
            $scope.formInput = { name: event.target.value, config:{} };
            $scope.fetchSchema(event.target.value);
        });
    }
}]);