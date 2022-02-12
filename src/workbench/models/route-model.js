/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

/**
 * @typedef {Object} RouteModel - The route model to be attached to the scope.
 *
 * @property {string} name - The route name.
 * @property {string[]} protocols - An array of applicable protocols.
 */

/**
 * Defines the route model with default values.
 *
 * @type {RouteModel}
 */
const RouteModel = {
    name: '',
    protocols: [],
    methods: [],
    hosts: [],
    paths: [],
    headers: [],
    https_redirect_status_code: '426',
    regex_priority: 0,
    strip_path: true,
    path_handling: 'v0',
    preserve_host: false,
    request_buffering: true,
    response_buffering: true,
    service: '__none__',
    snis: [],
    sources: [],
    destinations: [],
    tags: []
};

export default RouteModel;
