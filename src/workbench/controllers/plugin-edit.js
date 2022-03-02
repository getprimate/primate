/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import * as _ from '../lib/core-toolkit.js';
import {epochToDate} from '../helpers/date-lib.js';
import {simplifyObjectId} from '../helpers/rest-toolkit.js';

import pluginModel from '../models/plugin-model.js';

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
            let attributes = field[name];
            let checkEnum = true;

            attributes.fieldName = _.snakeToDisplayText(name);

            switch (attributes.type) {
                case 'integer':
                case 'number':
                    attributes.nodeType = 'input__number';
                    break;

                case 'set':
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
                    attributes.nodeType = 'static-record';
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
 * @param {Object} scope - The injected scope object.
 * @param {Object} location - Injected location service.
 * @param {function} location.path - Tells the current view path.
 * @param {Object} routeParams - Injected route parameters service.
 * @param {string} routeParams.serviceId - The service id, if attached to a service.
 * @param {string} routeParams.routeId - The route id, if attached to a service.
 * @param {string} routeParams.pluginId - The plugin object id in edit mode.
 * @param {RESTClientFactory} restClient - Custom AJAX provider.
 * @param {ViewFrameFactory} viewFrame - Custom view frame factory.
 * @param {ToastFactory} toast - Custom toast message service.
 */
export default function PluginEditController(scope, location, routeParams, restClient, viewFrame, toast) {
    const ajaxConfig = {method: 'POST', endpoint: '/plugins'};
    let loaderSteps = 4;

    scope.ENUM_PROTOCOL = ['grpc', 'grpcs', 'http', 'https', 'tcp', 'udp', 'tls', 'tls_passthrough'].map((protocol) => {
        return {nodeValue: protocol, displayText: protocol.toUpperCase()};
    });

    scope.pluginModel = _.deepClone(pluginModel);
    scope.pluginList = [];

    scope.jsonText = 'Test';

    scope.schemaProps = {};
    scope.schemaModel = {};

    scope.serviceId = '__none__';
    scope.routeId = '__none__';
    scope.consumerId = '__none__';

    scope.serviceList = [];
    scope.routeList = [];
    scope.consumerList = [];

    scope.fetchAvailablePlugins = function () {
        const request = restClient.get('/plugins/enabled');

        request.then(({data: response}) => {
            scope.pluginList = Array.isArray(response.enabled_plugins) ? response.enabled_plugins : [];
        });

        request.catch(() => {
            toast.error('Could not fetch list of enabled plugins');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });

        return true;
    };

    scope.fetchSchema = (plugin, config = null) => {
        const request = restClient.get(`/plugins/schema/${plugin}`);

        request.then(({data: response}) => {
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

            return true;
        });

        request.catch(() => {
            toast.error('Unable to load plugin schema.');
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

    scope.submitPluginForm = function (event) {
        if (typeof event === 'undefined') {
            return false;
        }

        try {
            const payload = _buildPluginObject(scope.pluginModel, scope.schemaModel);

            const request = restClient.request({method: ajaxConfig.method, endpoint: ajaxConfig.endpoint, payload});

            request.then(({data: response}) => {
                toast.message(scope.pluginId === '__none__' ? 'SUCCESS' : 'INFO', 'Plugin details saved.');

                window.location.href = '#!' + location.path().replace('__create__', response.id);
            });

            request.catch(() => {
                toast.error('Unable to save plugin details.');
            });
        } catch (error) {
            toast.error(error.message);
        }

        return false;
    };

    /**
     * Retrieves the list of services to populate the select box.
     *
     * @return {boolean} True if the request could be made, false otherwise.
     */
    scope.fetchServiceList = function () {
        const request = restClient.get('/services');

        request.then(({data: response}) => {
            const services = [];

            for (let service of response.data) {
                services.push({
                    id: service.id,
                    displayText: _.isText(service.name) ? service.name : `${service.host}:${service.port}`,
                    subTagsText: _.isEmpty(service.tags) ? epochToDate(service.created_at) : _.implode(service.tags)
                });
            }

            scope.serviceList = services;
            delete response.data;
        });

        request.catch(() => {
            toast.warning('Unable to fetch services.');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });

        return true;
    };

    /**
     * Retrieves the list of consumers to populate the select box.
     *
     * @return {boolean} True if the request could be made, false otherwise.
     */
    scope.fetchConsumerList = function () {
        const request = restClient.get('/consumers');

        request.then(({data: response}) => {
            const consumers = [];

            for (let consumer of response.data) {
                consumers.push({
                    id: consumer.id,
                    displayText: _.isText(consumer.username)
                        ? `Username: ${consumer.username}`
                        : `Custom Id: ${consumer.custom_id}`,
                    subTagsText: _.isEmpty(consumer.tags) ? epochToDate(consumer.created_at) : _.implode(consumer.tags)
                });
            }

            scope.consumerList = consumers;
            delete response.data;
        });

        request.catch(() => {
            toast.warning('Unable to fetch consumers.');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });

        return true;
    };

    /**
     * Retrieves the list of routes to populate the select box.
     *
     * @return {boolean} True if the request could be made, false otherwise.
     */
    scope.fetchRouteList = function () {
        const request = restClient.get('/routes');

        request.then(({data: response}) => {
            const routes = [];

            for (let route of response.data) {
                routes.push({
                    id: route.id,
                    displayText: _.isText(route.name) ? route.name : simplifyObjectId(route.id),
                    subTagsText: _.isEmpty(route.tags) ? epochToDate(route.created_at) : _.implode(route.tags)
                });
            }

            scope.routeList = routes;
            delete response.data;
        });

        request.catch(() => {
            toast.warning('Unable to fetch consumers.');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });

        return true;
    };

    /* Modify plugin resource endpoint according to the route parameters provided. */
    for (let entity of ['route', 'service', 'consumer']) {
        let idField = routeParams[`${entity}Id`];

        if (_.isText(idField)) {
            ajaxConfig.endpoint = `/${entity}s/${idField}/${ajaxConfig.endpoint}`;

            scope[`${entity}Id`] = idField;
            scope.pluginModel[entity] = idField;

            loaderSteps--;
        }
    }

    viewFrame.clearBreadcrumbs();
    viewFrame.addBreadcrumb('#!/plugins', 'Plugins');

    switch (routeParams.pluginId) {
        case '__create__':
            scope.pluginId = '__none__';

            viewFrame.setTitle('Apply Plugin');
            viewFrame.addBreadcrumb(location.path(), 'Create +');
            break;

        default:
            ajaxConfig.method = 'PATCH';
            ajaxConfig.endpoint = `${ajaxConfig.endpoint}/${routeParams.pluginId}`;

            scope.pluginId = routeParams.pluginId;

            viewFrame.setTitle('Edit Plugin');
            break;
    }

    viewFrame.setLoaderSteps(loaderSteps);

    if (ajaxConfig.method === 'PATCH' && scope.pluginId !== '__none__') {
        const request = restClient.get(`/plugins/${scope.pluginId}`);

        request.then(({data: response}) => {
            _refreshPluginModel(scope.pluginModel, response);

            scope.fetchSchema(response.name, response.config);

            viewFrame.addBreadcrumb(location.path(), response.name);
        });

        request.catch(() => {
            toast.error('Unable to retrieve plugin details.');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });
    } else {
        scope.fetchAvailablePlugins();
    }

    for (let entity of ['Service', 'Route', 'Consumer']) {
        let modelPrefix = entity.toLowerCase();

        if (_.isNone(scope[`${modelPrefix}Id`])) {
            let method = scope[`fetch${entity}List`];
            method.call(null);
        }
    }

    scope.$on('$destroy', () => {
        scope.serviceList.length = 0;
        scope.routeList.length = 0;
        scope.consumerList.length = 0;

        scope.pluginList.length = 0;

        delete scope.pluginModel;
        delete scope.schemaProps;
        delete scope.schemaModel;

        delete scope.serviceList;
        delete scope.routeList;
        delete scope.consumerList;

        delete scope.jsonText;
    });
}
