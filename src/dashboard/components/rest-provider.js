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
 * @typedef {Object} K_RESTFactory
 * @property {(function(options: Object): Promise)} request - Makes an HTTP request of specified method.
 * @property {(function(endpoint: string): Promise)} get - Makes an HTTP GET request.
 * @property {(function(endpoint: string, payload: Object): Promise)} post - Makes an HTTP POST request.
 * @property {(function(endpoint: string, payload: Object): Promise)} put - Makes an HTTP PUT request.
 * @property {(function(endpoint: string, payload: Object): Promise)} patch - Makes an HTTP PATCH request.
 * @property {(function(endpoint: string): Promise)} delete - Makes an HTTP DELETE request.
 * @property {(function(host: string): undefined)} setHost - Sets the host name.
 */

/**
 * @typedef {function} K_RESTProvider
 * @property {function} initialize - Initializes with the provided configuration.
 */

import _ from '../../lib/utility.js';

/**
 * Stores system-wide HTTP configuration.
 *
 * @type {Object}
 * @property {string} host - The server host
 * @property {authorization} -
 */
const REST_CONFIG = {
    host: '',
    authorization: null,
    accept: 'application/json',
    contentType: 'application/json'
};

function configure(options) {
    const request = {
        method: options.method,
        url: options.url || REST_CONFIG.host + options.resource,
        headers: {},
        withCredentials: false
    };

    if (typeof options.url === 'string') {
        request.url = options.url;
    } else {
        request.url = REST_CONFIG.host + (typeof options.endpoint === 'string' ? options.endpoint : options.resource);
    }

    if (typeof options.data === 'object') request.data = options.data;

    if (typeof REST_CONFIG.authorization === 'string') {
        request.withCredentials = true;
        request.headers['Authorization'] = REST_CONFIG.authorization;
    }

    if (typeof REST_CONFIG.accept === 'string') request.headers['Accept'] = REST_CONFIG.accept;

    if (typeof REST_CONFIG.contentType === 'string') request.headers['Content-Type'] = REST_CONFIG.contentType;

    if (typeof options.headers === 'object') {
        Object.keys(options.headers).forEach(function (item) {
            request.headers[item] = options.headers[item];
        });
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

function restFactory(http) {
    return {
        request: function (options) {
            return http(configure(options));
        },
        get: function (options) {
            options.method = 'GET';
            return http(configure(options));
        },
        post: function (options) {
            options.method = 'POST';
            return http(configure(options));
        },
        put: function (options) {
            options.method = 'PUT';
            return http(configure(options));
        },
        patch: function (options) {
            options.method = 'PATCH';
            return http(configure(options));
        },
        delete: function (options) {
            options.method = 'DELETE';
            return http(configure(options));
        },
        setHost: function (host) {
            REST_CONFIG.host = host;
        }
    };
}

/**
 * Implements the provider for {@link K_RESTFactory REST factory service}.
 *
 * @constructor
 * @type {K_RESTProvider}
 */
export default function RestProvider() {
    this.initialize = (options) => {
        for (let name in options) {
            if (!_.isDefined(REST_CONFIG[name])) {
                continue;
            }

            switch (name) {
                case 'authorization':
                    REST_CONFIG[name] = 'Basic ' + btoa(options[name]);
                    break;

                default:
                    REST_CONFIG[name] = options[name];
                    break;
            }
        }
    };

    this.setHost = (host) => {
        REST_CONFIG.host = host;
    };

    this.setBasicAuth = (username, password) => {
        REST_CONFIG.authorization = 'Basic ' + btoa(username + ':' + (password || ''));
    };

    this.setAcceptType = (type) => {
        REST_CONFIG.accept = type;
    };

    this.setContentType = (type) => {
        REST_CONFIG.contentType = type;
    };

    this.$get = ['$http', restFactory];
}
