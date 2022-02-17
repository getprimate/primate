/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import * as _ from '../../lib/core-toolkit.js';
import {epochToDate} from '../helpers/date-lib.js';
import {urlOffset, urlQuery, editViewURL, simplifyObjectId} from '../helpers/rest-toolkit.js';

import routeModel from '../models/route-model.js';

/**
 * Holds the list of available protocols and their configuration.
 *
 * The configuration also specifies the array of fields that are required
 * for a particular protocol. Also, the fields required to be removed
 * can be obtained from the _exclusive_ property, to avoid validation errors.
 *
 * @type {Object}
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
function explodeAddress(sources = []) {
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
 * This function reverses {@link explodeAddress}.
 *
 * @param {string[]} sources - The input IP addresses.
 * @returns {string[]} Array of imploded IP addresses.
 */
function implodeAddress(sources = []) {
    return sources.map((current) => {
        let {ip, port} = current;

        port = port === null ? '' : `${port}`;
        return `${ip}:${port}`;
    });
}

/**
 * Creates header name - value map from token list.
 *
 * @param {string[]} tokens - Array of tokens
 * @return {{}} The header name - value map.
 */
function createHeaderMap(tokens) {
    const headerMap = {};

    for (let token of tokens) {
        token = token.trim();

        let index = token.indexOf(':');

        if (index <= 0) {
            continue;
        }

        let name = token
            .substring(0, index)
            .trim()
            .replace(/[^-_a-zA-Z0-9]/g, '-');

        if (name.length === 0) {
            continue;
        }

        let value = index >= token.length - 1 ? '' : token.substring(index + 1);
        headerMap[name] = _.explode(value, ',');
    }

    return headerMap;
}

/**
 * Creates header tokens from name-value map.
 *
 * This function does the reverse of {@link createHeaderMap}.
 *
 * @param {Object} headers - The header key-value pair.
 * @return {string[]} The token array.
 */
function implodeHeaders(headers) {
    const nameList = Object.keys(headers);
    const tokens = [];

    for (let name of nameList) {
        let values = headers[name];
        tokens.push(`${name}: ` + (Array.isArray(values) ? values.join(', ') : ''));
    }

    return tokens;
}

/**
 * Populates the route model after sanitising values in the route object.
 *
 * @private
 * @see https://docs.konghq.com/gateway/2.7.x/admin-api/#route-object
 *
 * @param {Object} source - The route object from which route model is to be built.
 * @param {RouteModel} model - The route model which needs to be populated.
 * @returns {RouteModel} The populated route model.
 */
function refreshRouteModel(model, source) {
    const fieldList = Object.keys(source);

    for (let field of fieldList) {
        if (_.isNil(model[field]) || _.isNil(source[field])) {
            continue;
        }

        switch (field) {
            case 'sources':
            case 'destinations':
                model[field] = implodeAddress(source[field]);
                break;

            case 'service':
                model[field] = _.get(source[field], 'id', '__none__');
                break;

            case 'https_redirect_status_code':
                model[field] = `${source[field]}`;
                break;

            case 'headers':
                model[field] = implodeHeaders(source[field]);
                break;

            default:
                model[field] = source[field];
                break;
        }
    }

    return model;
}

/**
 * Builds route object after sanitising values in a specified route model.
 *
 * Technically, this function does the inverse of {@link refreshRouteModel} function.
 * The function validates route model before preparing the payload. Throws an error
 * if the validation fails.
 *
 * @see https://docs.konghq.com/gateway/2.7.x/admin-api/#route-object
 *
 * @private
 * @param {RouteModel} model - The source route model.
 * @returns {Object} The route object.
 */
function buildRouteObject(model) {
    if (model.protocols.length === 0) {
        throw 'Please check at least one protocol from the list.';
    }

    const payload = _.deepClone(model);
    const fields = Object.keys(model);

    payload['headers'] = null;

    for (let field of fields) {
        if (_.isText(model[field])) {
            model[field] = model[field].trim();
        }

        switch (field) {
            case 'sources':
            case 'destinations':
                payload[field] = explodeAddress(model[field]);
                break;

            case 'https_redirect_status_code':
                payload[field] = parseInt(model[field]);
                break;

            case 'headers':
                payload.headers = createHeaderMap(model[field]);
                break;

            case 'service':
                payload['service'] = null;

                if (model[field].length >= 10) {
                    payload[field] = {id: model[field]};
                }
                break;

            default:
                break;
        }
    }

    for (let protocol of model.protocols) {
        let inputFields = PROTOCOL_CONFIG[protocol]['required'];
        let isValidated = false;

        for (let field of inputFields) {
            if (Array.isArray(model[field]) && model[field].length >= 1) {
                isValidated = true;
                break;
            }
        }

        if (isValidated === false) {
            let required = inputFields.join(', ');
            let selected = protocol.toUpperCase();

            throw new Error(`At least one of ${required} is required, if ${selected} is selected.`);
        }

        /* Remove the mutually exclusive fields depending on the protocols to avoid a validation error.
         *
         * For example: The payload should not contain "hosts", "paths", "methods" and "headers" fields
         * if either of TCP, UDP, TLS or TLS Pass-through are selected.
         *
         * Similarly, the payload should not contain "sources" and "destinations" fields
         * if HTTP, HTTPS, GRPC or GRPCS are selected. */
        switch (protocol) {
            case 'grpc':
            case 'grpcs':
                delete payload.strip_path;
                break;
        }

        const excluded = PROTOCOL_CONFIG._exclusive_.filter((item) => {
            return inputFields.includes(item) === false;
        });

        for (let field of excluded) {
            if (_.isNil(payload[field])) {
                continue;
            }

            payload[field] = null;
        }
    }

    return payload;
}

/**
 * Provides controller constructor for editing route objects.
 *
 * @constructor
 * @param {Object} scope - The injected scope object.
 * @param {Object} location - Injected location service.
 * @param {function} location.path - Tells the current view path.
 * @param {{
 *          serviceId: string, pluginId: string, routeId: string
 *      }} routeParams - Injected route parameters service.
 * @param {string} routeParams.routeId - The route id in editing mode.
 * @param {RESTClientFactory} restClient - Custom AJAX provider.
 * @param {ViewFrameFactory} viewFrame - Custom view frame factory.
 * @param {ToastFactory} toast - Custom toast message service.
 */
export default function RouteEditController(scope, location, routeParams, restClient, viewFrame, toast) {
    const restConfig = {method: 'POST', endpoint: '/routes'};
    const eventLocks = {submitRouteForm: false, togglePluginState: false};

    let loaderSteps = 0;

    scope.ENUM_PROTOCOL = ['http', 'https', 'grpc', 'grpcs', 'tcp', 'tls', 'tls_passthrough'];
    scope.ENUM_METHOD = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTION'];
    scope.ENUM_REDIRECT_CODE = [426, 301, 302, 307, 308];

    scope.currentPath = location.path();

    scope.routeId = '__none__';
    scope.routeModel = _.deepClone(routeModel);

    scope.serviceId = '__none__';
    scope.serviceList = [];

    scope.pluginList = [];
    scope.pluginNext = {offset: ''};

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
        event.preventDefault();

        if (eventLocks.submitRouteForm === true) {
            return false;
        }

        let payload = null;

        try {
            payload = buildRouteObject(scope.routeModel);
            eventLocks.submitRouteForm = true;

            viewFrame.incrementLoader();
        } catch (error) {
            toast.error(error.message);
            return false;
        }

        const request = restClient.request({
            method: restConfig.method,
            endpoint: restConfig.endpoint,
            payload
        });

        request.then(({data: response}) => {
            const redirectURL = editViewURL(location.path(), response.id);
            const displayText = _.isText(response.name) ? response.name : simplifyObjectId(response.id);

            if (scope.routeId === '__none__') {
                scope.routeId = response.id;

                restConfig.method = 'PATCH';
                restConfig.endpoint = `${restConfig.endpoint}/${scope.routeId}`;
            }

            viewFrame.popBreadcrumb();
            viewFrame.addBreadcrumb(redirectURL, displayText);

            toast.success('Route details saved successfully.');
        });

        request.catch(() => {
            toast.error('Unable to save route details.');
        });

        request.finally(() => {
            eventLocks.submitRouteForm = false;
            viewFrame.incrementLoader();
        });

        return true;
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
        event.preventDefault();

        if (eventLocks.submitRouteForm === true) {
            return false;
        }

        const proceed = confirm('Proceed to clear the form?');

        if (proceed) {
            scope.routeModel = _.deepClone(routeModel);
        }

        return proceed;
    };

    /**
     * Retrieves the list of services for attaching to the route.
     *
     * @return {boolean} True if request could be made, false otherwise.
     */
    scope.fetchServiceList = function () {
        const request = restClient.get('/services');

        request.then(({data: response}) => {
            for (let service of response.data) {
                let displayText = _.isText(service.name) ? service.name : `${service.host}:${service.port}`;
                let subTagsText = _.isEmpty(service.tags) ? epochToDate(service.created_at) : _.implode(service.tags);

                scope.serviceList.push({id: service.id, displayText, subTagsText});
            }

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
     * Retrieves the list if plugins applied on this route.
     *
     * @param {string|object|null} filters - Filters to the Admin API.
     * @return {boolean} True if request could be made, false otherwise.
     */
    scope.fetchPluginList = function (filters = null) {
        const request = restClient.get(`/routes/${scope.routeId}/plugins` + urlQuery(filters));

        request.then(({data: response}) => {
            scope.pluginNext.offset = urlOffset(response.next);

            for (let plugin of response.data) {
                scope.pluginList.push({
                    id: plugin.id,
                    enabled: plugin.enabled,
                    displayText: plugin.name,
                    subTagsText: _.isEmpty(plugin.tags) ? epochToDate(plugin.created_at) : _.implode(plugin.tags)
                });
            }

            delete response.data;
        });

        request.catch(() => {
            toast.warning('Unable to fetch route plugins.');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });
    };

    if (_.isText(routeParams.serviceId)) {
        restConfig.endpoint = `/services/${routeParams.serviceId}/routes`;

        scope.serviceId = routeParams.serviceId;
        scope.routeModel.service = {id: routeParams.serviceId};
    } else {
        viewFrame.clearBreadcrumbs();
        loaderSteps++;
    }

    viewFrame.addBreadcrumb('#!/routes', 'Routes');

    switch (routeParams.routeId) {
        case '__create__':
            viewFrame.setTitle('Create Route');
            viewFrame.addBreadcrumb(location.path(), 'Create +');
            break;

        default:
            restConfig.method = 'PATCH';
            restConfig.endpoint = `${restConfig.endpoint}/${routeParams.routeId}`;

            scope.routeId = routeParams.routeId;
            viewFrame.setTitle('Edit Route');

            loaderSteps = loaderSteps + 2;
            break;
    }

    viewFrame.setLoaderSteps(loaderSteps);

    if (restConfig.method === 'PATCH' && !_.isNone(scope.routeId)) {
        const request = restClient.get(restConfig.endpoint);

        request.then(({data: response}) => {
            const {id, name} = response;
            refreshRouteModel(scope.routeModel, response);

            viewFrame.addAction(
                'Delete',
                viewFrame.previousRoute(false),
                'critical delete',
                'route',
                restConfig.endpoint
            );

            viewFrame.addBreadcrumb(location.path(), _.isText(name) ? name : simplifyObjectId(id));
        });

        request.catch(() => {
            toast.error('Unable to fetch route details.');
            window.location.href = '#!/routes';
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });

        scope.fetchPluginList();
    }

    if (_.isNone(scope.serviceId)) {
        scope.fetchServiceList();
    }
}
