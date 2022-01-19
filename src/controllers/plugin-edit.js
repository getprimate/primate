/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import _ from '../lib/utils.js';
import PluginModel from '../models/plugin-model.js';

function _buildSchemaModel(fields) {
    const model = {};

    for (let field of fields) {
        for (let name of Object.keys(field)) {
            switch (field[name].type) {
                case 'boolean':
                    model[name] = typeof field[name].default === 'boolean' ? field[name].default : false;
                    break;

                case 'number':
                    model[name] = typeof field[name].default === 'number' ? field[name].default : 0;
                    break;

                case 'array':
                    model[name] = Array.isArray(field[name].default) ? field[name].default : [];
                    break;

                case 'string':
                    model[name] = typeof field[name].default === 'string' ? field[name].default : '';
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
}

function _sanitiseSchema(schema) {
    const {fields} = schema;

    for (let field of fields) {
        for (let name of Object.keys(field)) {
            let attributes = field[name],
                checkEnum = true;

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

            if (checkEnum === true && typeof attributes.one_of === 'object' && Array.isArray(attributes.one_of)) {
                attributes.nodeType = 'select';
                attributes.nodeList = attributes.one_of;
            }
        }
    }

    return schema;
}

function _buildPluginObject(pluginModel, schemaModel) {
    if (typeof pluginModel.name !== 'string' || pluginModel.name === '__none__') {
        throw new Error('Please select a plugin from the list.');
    }

    const payload = _.deepClone(pluginModel);

    delete payload.service;
    delete payload.route;
    delete payload.consumer;

    if (pluginModel.service !== '__none__' && pluginModel.service.length > 12) {
        payload.service = {id: pluginModel.service};
    }

    if (pluginModel.route !== '__none__' && pluginModel.route.length > 12) {
        payload.route = {id: pluginModel.route};
    }

    if (pluginModel.consumer !== '__none__' && pluginModel.consumer.length > 12) {
        payload.consumer = {id: pluginModel.consumer};
    }

    payload.config = schemaModel;

    return payload;
}

function _refreshPluginModel(model, source) {
    for (let field in source) {
        if (typeof model[field] === 'undefined' || source[field] === null) {
            continue;
        }

        switch (field) {
            case 'service':
            case 'route':
            case 'consumer':
                model[field] = _.get(source[field], 'id', '__none__');
                break;

            default:
                model[field] = source[field];
                break;
        }
    }

    return model;
}

/**
 * Provides controller constructor for editing plugin objects.
 *
 * @constructor
 *
 * @param {Window} window- The top level Window object.
 * @param {Object} scope - The injected scope object.
 * @param {Object} location - Injected location service.
 * @param {function} location.path - Tells the current view path.
 * @param {Object} routeParams - Injected route parameters service.
 * @param {string} routeParams.serviceId - The service id, if attached to a service.
 * @param {string} routeParams.routeId - The route id, if attached to a service.
 * @param {string} routeParams.pluginId - The plugin object id in edit mode.
 * @param {AjaxProvider} ajax - Custom AJAX provider.
 * @param {ViewFrameFactory} viewFrame - Custom view frame factory.
 * @param {ToastFactory} toast - Custom toast message service.
 * @param {LoggerFactory} logger - Custom logger factory service.
 */
export default function PluginEditController(window, scope, routeParams, ajax, viewFrame, toast, logger) {
    const {angular} = window;
    const pluginForm = angular.element('form#pg-ed__frm01');

    const ajaxConfig = {method: 'POST', resource: '/plugins'};

    scope.ENUM_PROTOCOL = ['grpc', 'grpcs', 'http', 'https'].map((protocol) => {
        return {nodeValue: protocol, displayText: protocol.toUpperCase()};
    });

    switch (routeParams.pluginId) {
        case '__create__':
            scope.pluginId = '__none__';

            viewFrame.title = 'Apply Plugin';
            break;

        default:
            ajaxConfig.method = 'PATCH';
            ajaxConfig.resource = `${ajaxConfig.resource}/${routeParams.pluginId}`;

            scope.pluginId = routeParams.pluginId;

            viewFrame.title = 'Edit Plugin';
            break;
    }

    scope.pluginModel = _.deepClone(PluginModel);
    scope.pluginList = [];

    scope.jsonText = 'Test';

    scope.schemaProps = {};
    scope.schemaModel = {};

    scope.serviceId = '__none__';
    scope.routeId = '__none__';
    scope.consumerId = '__none__';

    /* Modify plugin resource endpoint according to the route parameters provided.
     * IMPORTANT: The order of these conditional statements needs to be maintained. */
    if (typeof routeParams.routeId === 'string') {
        ajaxConfig.resource = `/routes/${routeParams.routeId}${ajaxConfig.resource}`;

        scope.routeId = routeParams.routeId;
        scope.pluginModel.route = scope.routeId;
    }

    if (typeof routeParams.serviceId === 'string') {
        if (scope.routeId === '__none__') {
            ajaxConfig.resource = `/services/${routeParams.serviceId}${ajaxConfig.resource}`;
        }

        scope.serviceId = routeParams.serviceId;
        scope.pluginModel.service = scope.serviceId;
    }

    if (typeof routeParams.consumerId === 'string') {
        ajaxConfig.resource = `/consumers/${routeParams.consumerId}${ajaxConfig.resource}`;

        scope.consumerId = routeParams.consumerId;
        scope.pluginModel.consumer = scope.consumerId;
    }

    scope.serviceList = [];
    scope.routeList = [];
    scope.consumerList = [];

    scope.fetchAvailablePlugins = (resource = '/plugins/enabled') => {
        const request = ajax.get({resource});

        request.then(({data: response, httpText}) => {
            scope.pluginList = Array.isArray(response.enabled_plugins) ? response.enabled_plugins : [];
            logger.info(httpText);
        });

        request.catch(({data: exception, httpText}) => {
            toast.error('Could not fetch list of enabled plugins');
            logger.exception(httpText, exception);
        });

        return true;
    };

    scope.fetchServiceList = function (resource = '/services') {
        const request = ajax.get({resource});

        request.then(({data: response, httpText}) => {
            scope.pluginList = Array.isArray(response.enabled_plugins) ? response.enabled_plugins : [];
            logger.info(httpText);
        });

        request.catch(({data: exception, httpText}) => {
            toast.error('Could not fetch list of enabled plugins');
            logger.exception(httpText, exception);
        });

        return true;
    };

    scope.fetchSchema = (plugin, config = null) => {
        const request = ajax.get({resource: `/plugins/schema/${plugin}`});

        request.then(({data: response, httpText}) => {
            if (!Array.isArray(response['fields'])) {
                toast.warning('Malformed plugin schema object. Please check Admin API version.');
                return false;
            }

            const {fields} = response;

            if (_.isNil(config)) {
                scope.schemaModel = _buildSchemaModel(fields);
            } else {
                scope.schemaModel = config;
            }

            scope.schemaProps = _sanitiseSchema(response);

            scope.jsonText = JSON.stringify(scope.schemaProps, null, 4);

            logger.info(httpText);
            return true;
        });

        request.catch(({data: exception, httpText}) => {
            toast.error('Unable to load plugin schema.');
            logger.exception(httpText, exception);
        });

        return true;
    };

    scope.changePlugin = function () {
        if (scope.pluginModel.name === '__none__') {
            scope.schemaProps = {};
            scope.schemaModel = {};

            return true;
        }

        return scope.fetchSchema(scope.pluginModel.name);
    };

    pluginForm.on('change', 'input[name="schema_Switcher"]', (event) => {
        const {target} = event;
        scope.jsonText = JSON.stringify(target.value === 'schema' ? scope.schemaProps : scope.schemaModel, null, 4);
    });

    scope.submitPluginForm = function (event) {
        if (typeof event === 'undefined') {
            return false;
        }

        try {
            const payload = _buildPluginObject(scope.pluginModel, scope.schemaModel);

            const request = ajax.request({
                method: ajaxConfig.method,
                resource: ajaxConfig.resource,
                data: payload
            });

            request.then(({data: response, httpText}) => {
                toast.message(scope.pluginId === '__none__' ? 'SUCCESS' : 'INFO', 'Plugin details saved.');
                logger.info(httpText);

                window.location.href = '#!' + location.path().replace('__create__', response.id);
            });

            request.catch(({data: error, httpText}) => {
                toast.error('Unable to save plugin details.');
                logger.exception(httpText, error);
            });
        } catch (error) {
            toast.error(error.message);
        }

        return false;
    };

    viewFrame.title = 'Apply Plugin';

    if (ajaxConfig.method === 'PATCH' && scope.pluginId !== '__none__') {
        const request = ajax.get({resource: `/plugins/${scope.pluginId}`});

        request.then(({data: response, httpText}) => {
            _refreshPluginModel(scope.pluginModel, response);

            scope.fetchSchema(response.name, response.config);
            logger.info(httpText);
        });

        request.catch(({data: error, httpText}) => {
            toast.error('Unable to retrieve plugin details.');
            logger.exception(httpText, error);
        });
    } else {
        scope.fetchAvailablePlugins();
    }
}
