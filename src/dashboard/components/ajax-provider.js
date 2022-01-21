/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

/**
 * Stores system-wide HTTP configuration.
 */
const HTTP_CONFIG = {
    host: ''
};

function _configure(options) {
    const request = {
        method: options.method,
        url: options.url || HTTP_CONFIG.host + options.resource,
        headers: {},
        withCredentials: false
    };

    if (typeof options.url === 'string') {
        request.url = options.url;
    } else {
        request.url = HTTP_CONFIG.host + (typeof options.endpoint === 'string' ? options.endpoint : options.resource);
    }

    if (typeof options.data === 'object') request.data = options.data;

    if (typeof HTTP_CONFIG.authorization === 'string') {
        request.withCredentials = true;
        request.headers['Authorization'] = HTTP_CONFIG.authorization;
    }

    if (typeof HTTP_CONFIG.accept === 'string') request.headers['Accept'] = HTTP_CONFIG.accept;

    if (typeof HTTP_CONFIG.contentType === 'string') request.headers['Content-Type'] = HTTP_CONFIG.contentType;

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

function _request(http) {
    return {
        request: function (options) {
            return http(_configure(options));
        },
        get: function (options) {
            options.method = 'GET';
            return http(_configure(options));
        },
        post: function (options) {
            options.method = 'POST';
            return http(_configure(options));
        },
        put: function (options) {
            options.method = 'PUT';
            return http(_configure(options));
        },
        patch: function (options) {
            options.method = 'PATCH';
            return http(_configure(options));
        },
        delete: function (options) {
            options.method = 'DELETE';
            return http(_configure(options));
        },
        setHost: function (host) {
            HTTP_CONFIG.host = host;
        } /*,
        basicAuth: function (username, password) {
            if (!username) return;
            httpConfig.authorization = 'Basic ' + $base64.encode(username + ':' + (password || ''));
        }*/
    };
}

function AJAXProvider(base64) {
    this.setHost = (host) => {
        HTTP_CONFIG.host = host;
    };

    this.basicAuth = (username, password) => {
        HTTP_CONFIG.authorization = 'Basic ' + base64.encode(username + ':' + (password || ''));
    };

    this.accept = (type) => {
        HTTP_CONFIG.accept = type;
    };

    this.contentType = (type) => {
        HTTP_CONFIG.contentType = type;
    };

    this.$get = ['$http', _request];
}

export default AJAXProvider;
