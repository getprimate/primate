'use strict';

const _buildSchemaModel = (fields) => {
    const model = {};

    for (let field of fields) {
        for (let name of Object.keys(field)) {
            switch (field[name].type) {
                case 'boolean':
                    model[name] = (typeof field[name].default === 'boolean') ? field[name].default : false;
                    break;

                case 'number':
                    model[name] = (typeof field[name].default === 'number') ? field[name].default : 0;
                    break;

                case 'array':
                    model[name] = (Array.isArray(field[name].default)) ? field[name].default : [];
                    break;

                case 'string':
                    model[name] = (typeof field[name].default === 'string') ? field[name].default : '';
                    break;

                case 'record':
                    model[name] = _buildSchemaModel(field[name]['fields']);
                    break;

                default:
                    break;
            }
        }
    }

    return model;
};

const _sanitiseSchema = (schema) => {

    const {fields} = schema;

    for (let field of fields) {
        for (let name of Object.keys(field)) {
            let attributes = field[name], checkEnum = true;

            switch (attributes.type) {
                case 'integer':
                case 'number':
                    attributes.nodeType = 'input__number';
                    break;

                case 'array':
                    attributes.nodeType = 'token-input';
                    if (typeof attributes.elements === 'object' && Array.isArray(attributes.elements.one_of)) {
                        attributes.nodeType = 'multi-check';
                        attributes.nodeList = attributes.elements.one_of;
                    }
                    checkEnum = false;
                    break;

                case 'boolean':
                    attributes.nodeType = 'input__checkbox';
                    checkEnum = false;
                    break;

                case 'string':
                    attributes.nodeType = 'input__text';
                    break;

                case 'record':
                    attributes.nodeType = 'record';
                    _sanitiseSchema(attributes);
                    break;

                default:
                    break;
            }

            if (checkEnum === true
                && typeof attributes.one_of === 'object'
                && Array.isArray(attributes.one_of)) {
                attributes.nodeType = 'select';
                attributes.nodeList = attributes.one_of;
            }
        }
    }

    return schema;
};

export default function PluginEditController(window, scope, routeParams, ajax, viewFrame, toast) {
    const {angular} = window;
    const pluginForm = angular.element('form#pg-ed__frm01');

    scope.pluginId = '__none__';
    scope.pluginModel = {name: ''};
    scope.pluginList = [];

    scope.jsonText = 'Test';

    scope.schemaProps = {};
    scope.schemaModel = {};

    scope.fetchPluginList = (resource = '/plugins/enabled') => {
        const request = ajax.get({resource});

        request.then(({data: response}) => {
            scope.pluginList = Array.isArray(response.enabled_plugins) ? response.enabled_plugins : [];
            return true;
        });

        request.catch(()=> {
            toast.error('Could not fetch list of enabled plugins');
            return false;
        });
    };

    scope.fetchSchema = (plugin) => {
        const request = ajax.get({ resource: `/plugins/schema/${plugin}`});

        request.then(({data: response}) => {
            if (!Array.isArray(response['fields'])) {
                toast.warning('Malformed plugin schema object. Please check Admin API version.');
                return false;
            }

            const {fields} = response;
            scope.schemaModel = _buildSchemaModel(fields);
            scope.schemaProps = _sanitiseSchema(response);

            scope.jsonText = JSON.stringify(scope.schemaProps, null, 4);

            return true;
        });

        request.catch(() => {
            toast.error('Unable to load plugin schema.');
            return false;
        });

        return true;
    };

    pluginForm.on('change', 'select#pg-ed__sel01', (event) => {
        const {target} = event;
        return scope.fetchSchema(target.value);
    });

    pluginForm.on('change', 'input[name="schema_Switcher"]', (event) => {
        const {target} = event;
        scope.jsonText = JSON.stringify((target.value === 'schema') ? scope.schemaProps : scope.schemaModel, null, 4);
    });

    viewFrame.title = 'Apply Plugin';

    scope.fetchPluginList();
}

/*
(function (angular, app) { 'use strict';
    const controller = 'PluginEditController';
    if (typeof app === 'undefined') throw (controller + ': app is undefined');

    app.controller(controller, ['$window', '$scope', '$routeParams', 'ajax', 'viewFrame', 'toast',
        function ($window, $scope, $routeParams, ajax, viewFrame, toast) {

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


                viewFrame.title = 'Edit ' + response.data.name + ' Plugin';
                viewFrame.deleteAction = { target: 'plugin', url: '/apis/' + $scope.apiId + '/plugins/' + $scope.pluginId };

            }, function () {
                toast.error('Could not fetch plugin details');
                $window.location.href = '#!/api';
            });

        } else {
            action = 'create';

            viewFrame.prevUrl = '#!/api/' + $scope.apiId;
            viewFrame.title = 'Add New Plugin';

            pluginForm.on('change', 'select[name="name"]', function (event) {
                $scope.formInput = { name: event.target.value, config:{} };
                $scope.fetchSchema(event.target.value);
            });
        }

        $scope.prevUrl = viewFrame.prevUrl;
    }]);

})(window.angular, app);
*/