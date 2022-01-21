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
import RouteModel from '../models/route-model.js';

/**
 * Holds the list of available protocols and their configuration.
 *
 * The configuration also specifies the array of fields that are required
 * for a particiular protocol. Also, the fields required to be removed
 * can be obtained from the _exlusive_ property, to avoid validation errors.
 *
 * @type {{
 *      _exclusive_: string[], http: {required: string[]},
 *      https: string[], tcp: {required: string[]},
 *      tls: string[], tls_passthrough: {required: string[]},
 *      grpc: string[], grpcs: {required: string[]}
 * }}
 */
const PROTOCOL_CONFIG = {
    _exclusive_: ['methods', 'hosts', 'headers', 'paths', 'sources', 'destinations'],
    http: {required: ['methods', 'hosts', 'headers', 'paths']},
    https: {required: ['methods', 'hosts', 'headers', 'paths', 'snis']},
    tcp: {required: ['sources', 'destinations']},
    tls: {required: ['sources', 'destinations', 'snis']},
    tls_passthrough: {required: ['snis']},
    grpc: {required: ['hosts', 'headers', 'paths']},
    grpcs: {required: ['hosts', 'headers', 'paths', 'snis']}
};

/**
 * Explodes and sanitises internet addresses.
 *
 * If the input is ['192.168.1.1:8000'],
 * the output will be [{ip: '192.168.1.1', port: 8000}].
 *
 * @param {string[]} sources - An array of IP addresses.
 * @returns {[{ip: string, port: number}]} Array of exploded IP addresses.
 */
function _explodeAddress(sources = []) {
    return sources.reduce((collection, current) => {
        let [ip, port = '-1'] = current.split(':');
        let item = {ip: ip.trim(), port: parseInt(port)};

        if (isNaN(item.port) || port <= -1 || port >= 65536) {
            delete item.port;
        }

        if (item.ip.length >= 1) {
            collection.push(item);
        }

        return collection;
    }, []);
}

/**
 * Implodes the internet addresses.
 *
 * This function reverses {@link _explodeAddress}.
 *
 * @param {string[]} sources - The input IP addresses.
 * @returns {string[]} Array of imploded IP addresses.
 */
function _implodeAddress(sources = []) {
    return sources.map((current) => {
        let {ip, port} = current;

        port = port === null ? '' : `${port}`;
        return `${ip}:${port}`;
    });
}

/**
 * Populates the route model after sanitising values in the route object.
 *
 * @private
 * @see https://docs.konghq.com/gateway/2.7.x/admin-api/#route-object
 *
 * @param {Object} source - The route object from which route model is to be built.
 * @param {App_RouteModel} model - The route model which needs to be populated.
 * @returns {App_RouteModel} The populated route model.
 */
function _refreshRouteModel(source, model) {
    for (let key of Object.keys(source)) {
        if (typeof model[key] === 'undefined' || source[key] === null) {
            continue;
        }

        switch (key) {
            case 'sources':
            case 'destinations':
                model[key] = _implodeAddress(source[key]);
                break;

            case 'service':
                model[key] = _.get(source[key], 'id', '');
                break;

            case 'https_redirect_status_code':
                model[key] = `${source[key]}`;
                break;

            default:
                model[key] = source[key];
                break;
        }
    }

    return model;
}

/**
 * Builds route object after sanitising values in a specified route model.
 *
 * Technically, this function does the inverse of {@link _refreshRouteModel} function.
 * The function validates route model before preparing the payload. Throws an error
 * if the validation fails.
 *
 * @see https://docs.konghq.com/gateway/2.7.x/admin-api/#route-object
 * @private
 *
 * @param {App_RouteModel} model - The source route model.
 * @returns {Object} The route object.
 */
function _buildRouteObject(model) {
    if (model.protocols.length === 0) {
        throw 'Please check at least one protocol from the list.';
    }

    const payload = Object.assign({}, model);

    for (let key of Object.keys(model)) {
        if (typeof model[key] === 'string') {
            model[key] = model[key].trim();
        }

        switch (key) {
            case 'sources':
            case 'destinations':
                delete payload[key];
                payload[key] = _explodeAddress(model[key]);
                break;

            case 'https_redirect_status_code':
                payload[key] = parseInt(model[key]);
                break;

            case 'service':
                delete payload[key];
                if (model[key].length >= 5) payload[key] = {id: model[key]};
                break;

            default:
                break;
        }
    }

    for (let current of model.protocols) {
        let isValidated = false;

        for (let field of PROTOCOL_CONFIG[current]['required']) {
            if (Array.isArray(model[field]) && model[field].length >= 1) {
                isValidated = true;
                break;
            }
        }

        if (isValidated === false) {
            throw (
                'At least one of <strong>' +
                PROTOCOL_CONFIG[current]['required'].join(', ') +
                '</strong> is required if ' +
                current.toUpperCase() +
                ' is selected.'
            );
        }

        /* Remove the mutually exclusive fields depending on the protocols to avoid a validation error.
         *
         * For example: The payload should not contain "hosts", "paths", "methods" and "headers" fields
         * if either of TCP, UDP, TLS or TLS Pass-through are selected.
         *
         * Similarly, the payload should not contain "sources" and "destinations" fields
         * if HTTP, HTTPS, GRPC or GRPCS are selected. */
        switch (current) {
            case 'grpc':
            case 'grpcs':
                delete payload.strip_path;
                break;
        }

        const excluded = PROTOCOL_CONFIG._exclusive_.filter((item) => {
            return !PROTOCOL_CONFIG[current]['required'].includes(item);
        });

        for (let field of excluded) {
            if (typeof payload[field] === 'undefined') continue;
            delete payload[field];
        }
    }

    return payload;
}

/**
 * Provides controller constructor for editing route objects.
 *
 * @constructor
 *
 * @param {Window} window- The top level Window object.
 * @param {Object} scope - The injected scope object.
 * @param {Object} location - Injected location service.
 * @param {function} location.path - Tells the current view path.
 * @param {Object} routeParams - Injected route parameters service.
 * @param {string} routeParams.serviceId - The service id,
 *                                          if attached to a service.
 * @param {string} routeParams.routeId - The route id in editing mode.
 * @param {AjaxProvider} ajax - Custom AJAX provider.
 * @param {K_ViewFrame} viewFrame - Custom view frame factory.
 * @param {K_Toast} toast - Custom toast message service.
 * @param {K_Logger} logger - Custom logger factory service.
 */
export default function RouteEditController(window, scope, location, routeParams, ajax, viewFrame, toast, logger) {
    const ajaxConfig = {method: 'POST', endpoint: '/routes'};

    scope.ENUM_PROTOCOL = ['http', 'https', 'grpc', 'grpcs', 'tcp', 'tls', 'tls_passthrough'];
    scope.ENUM_METHOD = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTION'];
    scope.ENUM_REDIRECT_CODE = [426, 301, 302, 307, 308];

    scope.currentPath = location.path();

    scope.routeId = '__none__';
    scope.routeModel = _.deepClone(RouteModel);

    scope.serviceId = '__none__';

    scope.pluginList = [];

    if (typeof routeParams.serviceId === 'string') {
        ajaxConfig.endpoint = `/services/${routeParams.serviceId}/routes`;

        scope.serviceId = routeParams.serviceId;
        scope.routeModel.service = {id: routeParams.serviceId};

        viewFrame.addRoute(`#!/services/${routeParams.serviceId}`);
    } else if (typeof routeParams.pluginId === 'string') {
        viewFrame.addRoute(`#!/plugins/${routeParams.pluginId}`);
    } else {
        viewFrame.addRoute('#!/services');
    }

    switch (routeParams.routeId) {
        case '__create__':
            viewFrame.setTitle('Create Route');
            break;

        default:
            ajaxConfig.method = 'PATCH';
            ajaxConfig.endpoint = `${ajaxConfig.endpoint}/${routeParams.routeId}`;

            scope.routeId = routeParams.routeId;
            viewFrame.setTitle('Edit Route');
            break;
    }

    /**
     * Handles route form submit event.
     *
     * The route object payload is prepared and POST or PATCH requests
     * are triggered according to create or edit mode respectively.
     *
     * @param {Object} event - The current event object.
     * @returns {boolean} True if the form could be submitted, false otherwise.
     */
    scope.submitRouteForm = function (event) {
        if (typeof event === 'undefined') {
            return false;
        }

        event.preventDefault();

        try {
            const payload = _buildRouteObject(scope.routeModel);
            const request = ajax.request({
                method: ajaxConfig.method,
                endpoint: ajaxConfig.endpoint,
                data: payload
            });

            request.then(({data: response, headerText}) => {
                logger.info(headerText);

                switch (scope.routeId) {
                    case '__none__':
                        toast.success('New route added.');
                        window.location.href = '#!' + location.path().replace('/__create__', `/${response.id}`);
                        break;

                    default:
                        toast.info('Route details updated.');
                }
            });

            request.catch(({data: exception, headerText}) => {
                toast.error('Could not save route details.');
                logger.exception(headerText, exception);
            });
        } catch (error) {
            toast.error(`${error}`);
        }

        return false;
    };

    /**
     * Handles route form reset event.
     *
     * Displays confirmation dialog before clearing the form.
     *
     * @param {Object} event - The current event object.
     * @return boolean - True if reset confirmed, false otherwise.
     */
    scope.resetRouteForm = function (event) {
        if (confirm('Proceed to clear the form?')) {
            scope.routeModel = _.deepClone(RouteModel);
            return true;
        }

        event.preventDefault();
        return false;
    };

    if (ajaxConfig.method === 'PATCH' && scope.routeId !== '__none__') {
        const request = ajax.get({endpoint: ajaxConfig.endpoint});

        request.then(({data: response, headerText}) => {
            _refreshRouteModel(response, scope.routeModel);

            viewFrame.addAction(
                'Delete',
                viewFrame.getNextRoute(false),
                'critical delete',
                'route',
                ajaxConfig.endpoint
            );

            logger.info(headerText);
        });

        request.catch(({data: error, headerText}) => {
            toast.error('Could not load route details.');
            logger.exception(headerText, error);

            window.location.href = viewFrame.getNextRoute();
        });
    }
}
