/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

/**
 * Provides a REST wrapper over Angular $http service.
 *
 * The REST service provides customisation options as per Kong admin API specifications.
 *
 * @typedef {Object} RESTClientFactory
 * @property {(function(options: Object): Promise)} request - Makes an HTTP request of specified method.
 * @property {(function(endpoint: string): Promise)} get - Makes an HTTP GET request.
 * @property {(function(endpoint: string, payload: Object): Promise)} post - Makes an HTTP POST request.
 * @property {(function(endpoint: string, payload: Object): Promise)} put - Makes an HTTP PUT request.
 * @property {(function(endpoint: string, payload: Object): Promise)} patch - Makes an HTTP PATCH request.
 * @property {(function(endpoint: string): Promise)} delete - Makes an HTTP DELETE request.
 * @property {(function(host: string): void)} setHost - Sets the host name.
 * @property {(function(void): boolean)} isConfigured - Tells if the factory is configured with a host name.
 */

/**
 * Implements the provider for {@link RESTClientFactory REST factory}.
 *
 * @typedef {Object} RESTClientProvider
 * @property {(function(options: Object): void)} initialize - Initializes with the provided options.
 */

import * as _ from '../lib/core-toolkit.js';

/**
 * Stores system-wide HTTP configuration.
 *
 * @type {Object}
 * @property {string} host - The server host
 * @property {authorization} -
 */
const CLIENT_CONFIG = {
    host: '',
    authorization: null,
    accept: 'application/json',
    contentType: 'application/json'
};

function configure(options, external = false) {
    const request = {
        method: options.method,
        url: options.url || CLIENT_CONFIG.host + options.resource,
        headers: {},
        withCredentials: false,
        timeout: 20000
    };

    if (typeof options.url === 'string') {
        request.url = options.url;
    } else {
        request.url = CLIENT_CONFIG.host + (typeof options.endpoint === 'string' ? options.endpoint : options.resource);
    }

    if (typeof options.payload === 'object') request.data = options.payload;
    else if (typeof options.data === 'object') request.data = options.data;

    if (typeof CLIENT_CONFIG.authorization === 'string' && external === false) {
        request.withCredentials = true;
        request.headers['Authorization'] = CLIENT_CONFIG.authorization;
    }

    if (typeof CLIENT_CONFIG.accept === 'string') request.headers['Accept'] = CLIENT_CONFIG.accept;

    if (typeof CLIENT_CONFIG.contentType === 'string') request.headers['Content-Type'] = CLIENT_CONFIG.contentType;

    if (typeof options.headers === 'object') {
        for (let header in options.headers) {
            request.headers[header] = options.headers[header];
        }
    }

    if (typeof options.query === 'object') {
        const query = new URLSearchParams();

        for (let param in options.query) {
            if (options.query[param] !== null) {
                query.append(param, options.query[param]);
            }
        }

        request.url = `${request.url}?` + query.toString();
    }

    if (Object.keys(request.headers).length <= 0) delete request.headers;

    return request;
}

/**
 * Builds and returns the REST factory singleton.
 *
 * @param {(function(Object): Promise)} http - The Angular $http service.
 * @returns {RESTClientFactory} REST factory.
 */
function buildRESTClientFactory(http) {
    return {
        request(options, external = false) {
            return http(configure(options, external));
        },

        get(endpoint) {
            return http(configure({method: 'GET', endpoint}));
        },

        post(endpoint, payload) {
            return http(configure({method: 'POST', data: payload, endpoint}));
        },

        put(endpoint, payload) {
            return http(configure({method: 'PUT', data: payload, endpoint}));
        },

        patch(endpoint, payload) {
            return http(configure({method: 'PATCH', data: payload, endpoint}));
        },

        delete(endpoint) {
            return http(configure({method: 'DELETE', endpoint}));
        },

        setHost(host) {
            CLIENT_CONFIG.host = host;
        },

        isConfigured() {
            return CLIENT_CONFIG.host.length >= 1;
        }
    };
}

export function urlOffset(location) {
    if (!_.isText(location)) return '';

    const url = new URL(location, CLIENT_CONFIG.host);
    const params = url.searchParams;

    return params.has('offset') ? params.get('offset') : '';
}


/**
 * Implements the provider for {@link RESTClientFactory REST factory service}.
 *
 * @constructor
 */
export default function RestClientProvider() {
    this.initialize = (options) => {
        for (let name in options) {
            if (!_.isDefined(CLIENT_CONFIG[name])) {
                continue;
            }

            CLIENT_CONFIG[name] = options[name];
        }
    };

    this.setHost = (host) => {
        CLIENT_CONFIG.host = host;
    };

    this.$get = ['$http', buildRESTClientFactory];
}
