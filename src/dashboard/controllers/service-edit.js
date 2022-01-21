/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

/**
 * @typedef {import('../components/view-frame-factory.js').K_ViewFrame} K_ViewFrame
 * @typedef {import('../components/toast-factory.js').K_Toast} K_Toast
 * @typedef {import('../components/logger-factory.js').K_Logger} K_Logger
 */

import _ from '../../lib/utils.js';
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
 * @private
 * @see https://docs.konghq.com/gateway/2.7.x/admin-api/#service-object
 *
 * @param {App_ServiceModel} model - A service model object.
 * @param {Object} source - A service object.
 * @return {App_ServiceModel} The populated service model.
 */
const _populateServiceModel = (model, source = {}) => {
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
};

/**
 * Prepares service object after sanitising values in a specified service model.
 *
 * Technically, this function does the inverse of {@link _populateServiceModel} function.
 * The function validates service model before preparing the payload. Throws an error
 * if the validation fails.
 *
 * @private
 * @see https://docs.konghq.com/gateway/2.7.x/admin-api/#service-object
 *
 * @param {App_ServiceModel} model - The source service model
 * @return {Object} The prepared service object
 */
const _prepareServiceObject = (model) => {
    if (model.host.length === 0) {
        throw new Error('Please provide a valid host');
    }

    const payload = Object.assign({}, model);
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
};

/**
 * Provides controller constructor for editing service objects.
 *
 * @constructor
 *
 * @param {Window} window- The top level Window object.
 * @param {Object} scope - The injected scope object.
 * @param {Object} location - Injected location service.
 * @param {function} location.path - Tells the current view path.
 * @param {Object} routeParams - Injected route parameters service.
 * @param {string} routeParams.serviceId - The service id in editing mode.
 * @param {AjaxProvider} ajax - Custom AJAX provider.
 * @param {K_ViewFrame} viewFrame - Custom view frame factory.
 * @param {K_Toast} toast - Custom toast message service.
 * @param {K_Logger} logger - Custom logger factory service.
 *
 * @property {string[]} scope.ENUM_PROTOCOL - An array of protocols from {@link ENUM_PROTOCOL}.
 * @property {string} scope.serviceId - Holds the service object id in edit mode.
 * @property {App_ServiceModel} scope.serviceModel - Holds the service model object.
 */
export default function ServiceEditController(window, scope, location, routeParams, ajax, viewFrame, toast, logger) {
    const {angular} = window;
    const ajaxConfig = {method: 'POST', endpoint: '/services'};

    scope.ENUM_PROTOCOL = Object.keys(ENUM_PROTOCOL);

    scope.serviceId = '__none__';
    scope.serviceModel = angular.copy(ServiceModel);

    scope.pbCertList = [];
    scope.caCertList = [];

    scope.routeList = [];

    scope.pluginList = [];

    viewFrame.addRoute('#!/services');

    switch (routeParams.serviceId) {
        case '__create__':
            viewFrame.setTitle('Create Service');
            break;

        default:
            ajaxConfig.method = 'PATCH';
            ajaxConfig.endpoint = `${ajaxConfig.endpoint}/${routeParams.serviceId}`;

            scope.serviceId = routeParams.serviceId;
            viewFrame.setTitle('Edit Service');
            break;
    }

    /**
     * Retrieves the public client certificates.
     *
     * @param {string} endpoint - The resource endpoint
     * @return boolean - True if request could be made, false otherwise
     */
    scope.fetchPublicCertificates = (endpoint = '/certificates') => {
        const request = ajax.get({endpoint});

        request.then(({data: response, config: httpConfig, status: statusCode, statusText}) => {
            for (let current of response.data) {
                scope.pbCertList.push({
                    nodeValue: current.id,
                    displayText: (_.objectName(current.id) + ' - ' + current.tags.join(', ')).substring(0, 64)
                });
            }

            logger.info({source: 'http-response', httpConfig, statusCode, statusText});
        });

        request.catch(({data: exception, config: httpConfig, status: statusCode, statusText}) => {
            toast.error('Could not load public certificates.');
            logger.error({source: 'admin-error', statusCode, statusText, httpConfig, exception});
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
        const request = ajax.get({endpoint});

        request.then(({data: response, config: httpConfig, status: statusCode, statusText}) => {
            const certificates = [];

            for (let current of response.data) {
                certificates.push({
                    nodeValue: current.id,
                    displayText: (_.objectName(current.id) + ' - ' + current.tags.join(', ')).substring(0, 64)
                });

                scope.caCertList = certificates;
            }

            logger.info({source: 'http-response', httpConfig, statusCode, statusText});
        });

        request.catch(({data: exception, config: httpConfig, status: statusCode, statusText}) => {
            toast.error('Could not load CA certificates.');
            logger.error({source: 'admin-error', statusCode, statusText, httpConfig, exception});
        });

        return true;
    };

    /**
     * Retrieves the routes added under this service.
     *
     * @param {string} endpoint - The resource endpoint
     * @return boolean - True if request could be made, false otherwise
     */
    scope.fetchRoutes = (endpoint = '/routes') => {
        const request = ajax.get({endpoint});

        request.then(({data: response, config: httpConfig, status: statusCode, statusText}) => {
            for (let current of response.data) {
                scope.routeList.push(current);
            }

            logger.info({source: 'http-response', httpConfig, statusCode, statusText});
        });

        request.catch(({data: exception, config: httpConfig, status: statusCode, statusText}) => {
            toast.error('Could not load routes under the service.');
            logger.error({source: 'admin-error', statusCode, statusText, httpConfig, exception});
        });

        return true;
    };

    /**
     * Handles form submit event.
     *
     * The service object payload is prepared and POST or PATCH
     * requests are triggered create or edit mode respectively.
     *
     * @param {Object} event - The current event object.
     * @return {boolean} True if the request could be made, false otherwise
     */
    scope.submitServiceForm = (event) => {
        if (typeof event === 'undefined') {
            return false;
        }

        event.preventDefault();

        Object.keys(scope.serviceModel).forEach((key) => {
            if (typeof scope.serviceModel[key] === 'string') scope.serviceModel[key] = scope.serviceModel[key].trim();
        });

        const payload = _prepareServiceObject(scope.serviceModel);
        const request = ajax.request({method: ajaxConfig.method, endpoint: ajaxConfig.endpoint, data: payload});

        request.then(({data: response, config: httpConfig, status: statusCode, statusText}) => {
            logger.info({source: 'http-response', httpConfig, statusCode, statusText});

            switch (scope.serviceId) {
                case '__none__':
                    toast.success(`Created new service ${response.name}`);
                    window.location.href = '#!' + location.path().replace('/__create__', `/${response.id}`);
                    break;

                default:
                    toast.info(`Updated service ${payload.name}.`);
            }
        });

        request.catch(({data: exception, config: httpConfig, status: statusCode, statusText}) => {
            toast.error('Could not ' + (scope.serviceId === '__none__' ? 'create new' : 'update') + ' service.');
            logger.error({source: 'admin-error', statusCode, statusText, httpConfig, exception});
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
    scope.resetServiceForm = (event) => {
        if (confirm('Proceed to clear the form?')) {
            scope.serviceModel = angular.copy(ServiceModel);
            return true;
        }

        event.preventDefault();
        return false;
    };

    if (ajaxConfig.method === 'PATCH' && scope.serviceId !== '__none__') {
        const request = ajax.get({endpoint: ajaxConfig.endpoint});

        request.then(({data: response}) => {
            _populateServiceModel(scope.serviceModel, response);
            viewFrame.addAction('Delete', '#!/services', 'critical delete', 'service', ajaxConfig.endpoint);
        });

        request.catch(() => {
            toast.error('Could not load service details');
            window.location.href = '#!/services';
        });

        scope.fetchRoutes(`/services/${scope.serviceId}/routes`);
    }

    scope.fetchPublicCertificates();
    scope.fetchCACertificates();
}

/*
angular.element('table#pluginListTable').on('click', 'input[type="checkbox"].plugin-state', (event) => {
    let state = (event.target.checked) ? 'enabled' : 'disabled';

    ajax.patch({
        endpoint: `/services/${scope.serviceId}/plugins/${event.target.value}`,
        data: { enabled: (state === 'enabled') },
    }).then(() => {
        toast.success(`Plugin ${event.target.dataset.name} ${state}`);

    }, () => {
        toast.error('Status could not not be changed');
    });
});
*/
