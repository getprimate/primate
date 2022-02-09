/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import {isText, objectName, deepClone, isEmpty} from '../../lib/core-toolkit.js';
import {simplifyObjectId, tagsToText, urlOffset, urlQuery} from '../helpers/rest-toolkit.js';
import {epochToDate} from '../helpers/date-lib.js';

import ServiceModel from '../models/service-model.js';

/**
 * Holds the list of available protocols and their configuration,
 *
 * The configuration also specifies the array of fields to be removed from
 * the service object payload to avoid validation errors.
 *
 * @type {{
 *      tcp: {excluded: string[]}, udp: {excluded: string[]},
 *      tls_passthrough: {excluded: string[]}, http: {excluded: string[]},
 *      tls: {excluded: string[]}, https: {excluded: *[]}, grpc: {excluded: string[]}
 * }}
 */
const ENUM_PROTOCOL = {
    http: {excluded: ['ca_certificates', 'tls_verify', 'tls_verify_depth']},
    https: {excluded: []},
    grpc: {excluded: ['ca_certificates', 'tls_verify', 'tls_verify_depth', 'path']},
    tcp: {excluded: ['ca_certificates', 'tls_verify', 'tls_verify_depth', 'path']},
    udp: {excluded: ['ca_certificates', 'tls_verify', 'tls_verify_depth', 'path']},
    tls: {excluded: ['ca_certificates', 'tls_verify', 'tls_verify_depth', 'path']},
    tls_passthrough: {excluded: ['ca_certificates', 'tls_verify', 'tls_verify_depth']}
};

/**
 * Populates Service model after sanitising values in the service object.
 *
 * @see https://docs.konghq.com/gateway/2.7.x/admin-api/#service-object
 *
 * @param {ServiceModel} model - A service model object.
 * @param {Object} source - A service object.
 * @return {ServiceModel} The populated service model.
 */
function populateServiceModel(model, source = {}) {
    for (let property in source) {
        if (typeof model[property] === 'undefined' || (Array.isArray(model[property]) && source[property] === null)) {
            continue;
        }

        switch (property) {
            case 'tls_verify':
                model[property] = source[property] === null ? 'default' : String(source[property]);
                break;

            case 'tls_verify_depth':
                model[property] = source[property] === null ? -1 : source[property];
                break;

            case 'client_certificate':
                model[property] =
                    source[property] !== null && typeof source[property]['id'] === 'string'
                        ? source[property]['id']
                        : '';
                break;

            case 'ca_certificates':
            case 'tags':
                model[property] = Array.isArray(source[property]) ? source[property] : [];
                break;

            default:
                model[property] = source[property];
                break;
        }
    }

    return model;
}

/**
 * Prepares service object after sanitising values in a specified service model.
 *
 * Technically, this function does the inverse of {@link populateServiceModel} function.
 * The function validates service model before preparing the payload. Throws an error
 * if the validation fails.
 *
 * @see https://docs.konghq.com/gateway/2.7.x/admin-api/#service-object
 *
 * @param {ServiceModel} model - The source service model
 * @return {Object} The prepared service object
 */
function prepareServiceObject(model) {
    if (model.host.length === 0) {
        throw new Error('Please provide a valid host');
    }

    const payload = deepClone(model);
    const {excluded} = ENUM_PROTOCOL[payload.protocol];

    delete payload.client_certificate;

    if (model.client_certificate.length > 10) {
        payload.client_certificate = {id: model.client_certificate};
    }

    switch (model.tls_verify) {
        case 'true':
        case 'false':
            payload.tls_verify = model.tls_verify === 'true';
            break;

        default:
            payload.tls_verify = null;
    }

    payload.tls_verify_depth = model.tls_verify_depth === -1 ? null : model.tls_verify_depth;

    if (Array.isArray(excluded)) {
        for (let field of excluded) {
            delete payload[field];
        }
    }

    return payload;
}

/**
 * Provides controller constructor for editing service objects.
 *
 * @constructor
 * @param {Object} scope - Injected scope object.
 * @param {Object} location - Injected Angular location service.
 * @param {function} location.path - Tells the current view path.
 * @param {Object} routeParams - Object containing route parameters.
 * @param {string} routeParams.serviceId - The service id in editing mode.
 * @param {RESTClientFactory} restClient - Customised HTTP REST client factory.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 * @param {ToastFactory} toast - Factory for displaying notifications.
 *
 * @property {string[]} scope.ENUM_PROTOCOL - An array of protocols from {@link ENUM_PROTOCOL}.
 * @property {string} scope.serviceId - Holds the service object id in edit mode.
 * @property {ServiceModel} scope.serviceModel - Holds the service model object.
 */
export default function ServiceEditController(scope, location, routeParams, restClient, viewFrame, toast) {
    const restConfig = {method: 'POST', endpoint: '/services'};
    let loaderSteps = 2;

    scope.ENUM_PROTOCOL = Object.keys(ENUM_PROTOCOL);

    scope.serviceId = '__none__';
    scope.serviceModel = deepClone(ServiceModel);

    scope.pbCertList = [];
    scope.caCertList = [];

    scope.routeList = [];
    scope.routeNext = {offset: ''};

    scope.pluginList = [];
    scope.pluginNext = {offset: ''};

    /**
     * Retrieves the public client certificates.
     *
     * @param {string} endpoint - The resource endpoint
     * @return boolean - True if request could be made, false otherwise
     */
    scope.fetchPublicCertificates = function (endpoint = '/certificates') {
        const request = restClient.get(endpoint);

        request.then(({data: response}) => {
            for (let current of response.data) {
                scope.pbCertList.push({
                    nodeValue: current.id,
                    displayText: (objectName(current.id) + ' - ' + current.tags.join(', ')).substring(0, 64)
                });
            }
        });

        request.catch(() => {
            toast.error('Could not load public certificates.');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });

        return true;
    };

    /**
     * Retrieves the CA certificates.
     *
     * @param {string} endpoint - The resource endpoint
     * @return boolean - True if request could be made, false otherwise
     */
    scope.fetchCACertificates = (endpoint = '/ca_certificates') => {
        const request = restClient.get(endpoint);

        request.then(({data: response}) => {
            const certificates = [];

            for (let current of response.data) {
                certificates.push({
                    nodeValue: current.id,
                    displayText: (objectName(current.id) + ' - ' + current.tags.join(', ')).substring(0, 64)
                });

                scope.caCertList = certificates;
            }
        });

        request.catch(() => {
            toast.error('Could not load CA certificates.');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });

        return true;
    };

    /**
     * Retrieves the routes associated with the current service.
     *
     * @param {string|object|null} filters - Filters to the Admin API endpoint.
     * @return boolean - True if request could be made, false otherwise
     */
    scope.fetchMappedRoutes = function (filters = null) {
        const request = restClient.get(`/services/${scope.serviceId}/routes` + urlQuery(filters));

        viewFrame.setLoaderSteps(1);

        request.then(({data: response}) => {
            scope.routeNext.offset = urlOffset(response.next);

            for (let route of response.data) {
                scope.routeList.push({
                    id: route.id,
                    displayText: isText(route.name) ? route.name : simplifyObjectId(route.id),
                    subTagsText: isEmpty(route.tags) ? epochToDate(route.created_at) : tagsToText(route.tags)
                });
            }

            delete response.data;
        });

        request.catch(() => {
            toast.error('Could not load routes under the service.');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });

        return true;
    };

    /**
     * Retrieves the plugins applied on the current service.
     *
     * @param {string|object|null} filters - Filters to the Admin API endpoint.
     * @return boolean - True if request could be made, false otherwise
     */
    scope.fetchAppliedPlugins = function (filters = null) {
        const request = restClient.get(`/services/${scope.serviceId}/plugins` + urlQuery(filters));

        viewFrame.setLoaderSteps(1);

        request.then(({data: response}) => {
            scope.pluginNext.offset = urlOffset(response.next);

            for (let plugin of response.data) {
                scope.pluginList.push({
                    id: plugin.id,
                    displayText: plugin.name,
                    subTagsText: isEmpty(plugin.tags) ? epochToDate(plugin.created_at) : tagsToText(plugin.tags),
                    enabled: plugin.enabled
                });
            }
        });

        request.catch(() => {
            toast.error('Could not load applied plugins.');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });

        return true;
    };

    /**
     * Submit changes made on the service form.
     *
     * The service object payload is prepared and POST or PATCH
     * requests are triggered create or edit mode respectively.
     *
     * @param {Object} event - The current event object.
     * @return {boolean} True if the request could be made, false otherwise
     */
    scope.submitServiceForm = function (event) {
        if (typeof event === 'undefined') {
            return false;
        }

        event.preventDefault();

        Object.keys(scope.serviceModel).forEach((key) => {
            if (typeof scope.serviceModel[key] === 'string') scope.serviceModel[key] = scope.serviceModel[key].trim();
        });

        const payload = prepareServiceObject(scope.serviceModel);
        const request = restClient.request({method: restConfig.method, endpoint: restConfig.endpoint, payload});

        request.then(({data: response}) => {
            switch (scope.serviceId) {
                case '__none__':
                    toast.success(`Created new service ${response.name}`);
                    window.location.href = '#!' + location.path().replace('/__create__', `/${response.id}`);
                    break;

                default:
                    toast.info(`Updated service ${payload.name}.`);
            }
        });

        request.catch(() => {
            toast.error('Could not ' + (scope.serviceId === '__none__' ? 'create new' : 'update') + ' service.');
        });

        return false;
    };

    /**
     * Handles form reset event.
     *
     * Displays confirmation dialog before clearing the form.
     *
     * @param {Object} event - The current event object
     * @return boolean - True if reset confirmed, false otherwise
     */
    scope.resetServiceForm = function (event) {
        if (confirm('Proceed to clear the form?')) {
            scope.serviceModel = deepClone(ServiceModel);
            return true;
        }

        event.preventDefault();
        return false;
    };

    /**
     * Toggles plugin state to enabled or disabled.
     *
     * The event listener is attached to plugin list table.
     *
     * @param {HTMLInputElement} target - The target checkbox element.
     * @returns {boolean} True if action completed, false otherwise.
     */
    scope.togglePluginState = function ({target}) {
        if (target.nodeName !== 'INPUT' || target.type !== 'checkbox') {
            return false;
        }

        const endpoint = `/services/${scope.serviceId}/plugins/${target.value}`;
        const request = restClient.patch(endpoint, {enabled: target.checked});

        request.then(() => {
            toast.success('Plugin ' + (target.checked ? 'enabled.' : 'disabled.'));
        });

        request.catch(() => {
            toast.error('Unable to change plugin state.');
        });

        return true;
    };

    viewFrame.clearBreadcrumbs();
    viewFrame.addBreadcrumb('#!/services', 'Services');

    switch (routeParams.serviceId) {
        case '__create__':
            viewFrame.setTitle('Create Service');
            viewFrame.addBreadcrumb(location.path(), 'Create +');
            break;

        default:
            restConfig.method = 'PATCH';
            restConfig.endpoint = `${restConfig.endpoint}/${routeParams.serviceId}`;

            scope.serviceId = routeParams.serviceId;
            viewFrame.setTitle('Edit Service');
            loaderSteps = 5;
            break;
    }

    viewFrame.setLoaderSteps(loaderSteps);

    if (restConfig.method === 'PATCH' && scope.serviceId !== '__none__') {
        const request = restClient.get(restConfig.endpoint);

        request.then(({data: response}) => {
            const {id, name} = response;
            populateServiceModel(scope.serviceModel, response);

            viewFrame.addBreadcrumb(`#!/services/${id}`, isText(name) ? name : objectName(id));
            viewFrame.addAction('Delete', '#!/services', 'critical delete', 'service', restConfig.endpoint);
        });

        request.catch(() => {
            viewFrame.resetLoader();
            toast.error('Could not load service details');

            window.location.href = '#!/services';
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });

        scope.fetchMappedRoutes();
        scope.fetchAppliedPlugins();
    }

    scope.fetchPublicCertificates();
    scope.fetchCACertificates();
}
