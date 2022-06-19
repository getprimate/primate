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

/**
 * Builds a plugin config model from the schema.
 *
 * The model will be populated with default values, if aailable.
 *
 * @param {[Object]} fields - The schema fields.
 * @returns {Object} The final model.
 */
function buildSchemaModel(fields) {
    const model = {};

    for (let field of fields) {
        for (let name of Object.keys(field)) {
            switch (field[name].type) {
                case 'boolean':
                    model[name] = typeof field[name].default === 'boolean' ? field[name].default : false;
                    break;

                case 'integer':
                case 'number':
                    model[name] = typeof field[name].default === 'number' ? field[name].default : 0;
                    break;

                case 'set':
                case 'array':
                    model[name] = Array.isArray(field[name].default) ? field[name].default : [];
                    break;

                case 'string':
                    model[name] = typeof field[name].default === 'string' ? field[name].default : '';
                    break;

                case 'map':
                    model[name] = _.isObject(field[name].default) ? field[name].default : {};
                    break;

                case 'record':
                    model[name] = buildSchemaModel(field[name]['fields']);
                    break;

                default:
                    break;
            }
        }
    }

    return model;
}

/**
 * Sanitises the plugin schema.
 *
 * This function also injects the proper widget name (as nodeType_) after
 * evaluatng the attribute properties.
 *
 * @param {Object} schema - The plugin schema.
 * @returns {Object} The sanitised schema.
 */
function sanitiseSchema(schema) {
    const {fields} = schema;

    for (let field of fields) {
        for (let name of Object.keys(field)) {
            let attributes = field[name];
            let checkEnum = true;

            attributes.fieldName = _.snakeToDisplayText(name);

            switch (attributes.type) {
                case 'integer':
                case 'number':
                    attributes.nodeType_ = 'input__number';
                    break;

                case 'set':
                case 'array':
                    attributes.nodeType_ = 'token-input';

                    if (typeof attributes.elements === 'object' && Array.isArray(attributes.elements.one_of)) {
                        attributes.nodeType_ = 'multi-check';
                        attributes.nodeList_ = attributes.elements.one_of;
                    } else if (typeof attributes.elements === 'object' && attributes.elements.type === 'record') {
                        attributes.nodeType_ = 'record-text';
                        //attributes.sanitise_ = 'json-parse';
                    }

                    checkEnum = false;
                    break;

                case 'boolean':
                    attributes.nodeType_ = 'input__checkbox';
                    checkEnum = false;
                    break;

                case 'string':
                    attributes.nodeType_ = 'input__text';
                    break;

                case 'map':
                    attributes.nodeType_ = 'record-map';

                    if (attributes.values.type === 'record') {
                        attributes.sanitise_ = 'value-json';
                    } else if (attributes.values.type === 'array') {
                        attributes.sanitise_ = 'value-array';
                    }

                    break;

                case 'record':
                    attributes.nodeType_ = 'record-static';
                    sanitiseSchema(attributes);
                    break;

                default:
                    break;
            }

            if (checkEnum === true && typeof attributes.one_of === 'object' && Array.isArray(attributes.one_of)) {
                attributes.nodeType_ = 'select';
                attributes.nodeList_ = attributes.one_of;
            }
        }
    }

    return schema;
}

/**
 * Builds the plugin object representation from the model.
 *
 * @param {Object} pluginModel - The plugin model.
 * @param {Object} schemaModel - The schema model.
 * @returns {Object} The object representation.
 */
function buildPluginObject(pluginModel, schemaModel) {
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

function refreshPluginModel(model, source) {
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
 * Sanitises the payload after matching with schema.
 *
 * @param {Object} payload - The plugin object payload.
 * @param {[Object]} schemaFieldList - The fields from schema properties object.
 * @returns {Object} The sanitised payload object.
 */
function sanitisePayload(payload, schemaFieldList) {
    /**
     * Required to hold a simplified version of
     * schemaProps property, received in 'fields' parameter.
     */
    const schemaFieldMap = {};

    for (let field of schemaFieldList) {
        for (let key of Object.keys(field)) {
            if (!_.isObject(field[key])) continue;

            schemaFieldMap[key] = field[key];
        }
    }

    const {config: pluginConfig} = payload;
    const configKeyList = Object.keys(pluginConfig);

    /* Iterating over the plugin configuration object in the payload. */
    for (let configKey of configKeyList) {
        /* Skip if either the key is missing in the fieldMap or
         * config property value is a number. */
        if (!_.isObject(schemaFieldMap[configKey]) || typeof pluginConfig[configKey] === 'number') {
            continue;
        }

        /* If the config field is optional and value is empty, remove it. */
        if (schemaFieldMap[configKey]['required'] !== true && _.isEmpty(pluginConfig[configKey])) {
            delete pluginConfig[configKey];
            continue;
        }

        /* Check if the field value needs to be passed through JSON.parse() */
        if (schemaFieldMap[configKey]['sanitise_'] === 'json-parse' && _.isText(pluginConfig[configKey])) {
            try {
                pluginConfig[configKey] = JSON.parse(pluginConfig[configKey]);
            } catch (e) {
                throw new Error(`The required field ${configKey} is not a proper JSON string.`);
            }

            continue;
        }

        /* Check if the field sis of type 'Map' and the map values arrays. */
        if (schemaFieldMap[configKey]['sanitise_'] === 'value-array' && _.isObject(pluginConfig[configKey])) {
            console.log(JSON.stringify(pluginConfig[configKey], null, 4));
            for (let mapKey of Object.keys(pluginConfig[configKey])) {
                pluginConfig[configKey][mapKey] = _.explode(pluginConfig[configKey][mapKey]);
            }
        }

        /* Check if the field sis of type 'Map' and the map values arrays. */
        if (schemaFieldMap[configKey]['sanitise_'] === 'value-json' && _.isObject(pluginConfig[configKey])) {
            let mapKey = '';

            try {
                for (mapKey of Object.keys(pluginConfig[configKey])) {
                    pluginConfig[configKey][mapKey] = JSON.parse(pluginConfig[configKey][mapKey]);
                }
            } catch (e) {
                throw new Error(`The field ${mapKey} in ${configKey} is not a proper JSON string.`);
            }
        }
    }

    return payload;
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

    scope.jsonText = 'Select a plugin to view the schema.';

    scope.schemaProps = {};
    scope.schemaModel = {};

    scope.serviceId = '__none__';
    scope.routeId = '__none__';
    scope.consumerId = '__none__';

    scope.serviceList = [];
    scope.routeList = [];
    scope.consumerList = [];

    /**
     * Retrieves the list of available plugins.
     *
     * @returns {boolean} True if successful, false otherwise.
     */
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

    /**
     * Retrieves the schema for the selected plugin.
     *
     * @returns {boolean} True if successful, false otherwise.
     */
    scope.fetchSchema = (plugin, config = null) => {
        const request = restClient.get(`/plugins/schema/${plugin}`);

        request.then(({data: response}) => {
            if (!Array.isArray(response['fields'])) {
                toast.warning('Malformed plugin schema object. Please check Admin API version.');
                return false;
            }

            const {fields} = response;

            if (_.isNil(config)) {
                scope.schemaModel = buildSchemaModel(fields);
            } else {
                scope.schemaModel = config;
            }

            scope.schemaProps = sanitiseSchema(response);
            scope.jsonText = JSON.stringify(scope.schemaProps, null, 4);

            return true;
        });

        request.catch(() => {
            toast.error('Unable to load plugin schema.');
        });

        return true;
    };

    /**
     * Handles plugin selection from drop down..
     *
     * @returns {boolean} True if successful, false otherwise.
     */
    scope.changePlugin = function () {
        if (scope.pluginModel.name === '__none__') {
            scope.schemaProps = {};
            scope.schemaModel = {};

            return true;
        }

        return scope.fetchSchema(scope.pluginModel.name);
    };

    /**
     * Posts the plugin data to the API.
     *
     * @param {Event} event -Form submit event.
     * @returns {boolean} True if successful, false otherwise.
     */
    scope.submitPluginForm = function (event) {
        viewFrame.setLoaderSteps(1);

        let payload = null;

        try {
            payload = buildPluginObject(scope.pluginModel, scope.schemaModel);
            payload = sanitisePayload(payload, scope.schemaProps.fields);
        } catch (error) {
            toast.error(error.message);
            return false;
        }

        const request = restClient.request({method: ajaxConfig.method, endpoint: ajaxConfig.endpoint, payload});

        request.then(({data: response}) => {
            toast.success('Plugin details saved.');
            window.location.href = '#!' + location.path().replace('__create__', response.id);
        });

        request.catch(() => {
            toast.error('Unable to save plugin details.');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });

        return true;
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
            refreshPluginModel(scope.pluginModel, response);
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
