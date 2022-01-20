/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

/**
 * @typedef {Object} App_RouteModel - The route model to be attached to the scope.
 *
 * @property {string} name - The route name.
 */

/**
 * Defines the route model with default values.
 *
 * @type {App_RouteModel}
 */
const RouteModel = {
    name: 'my-route',
    protocols: [],
    methods: [],
    hosts: [],
    paths: [],
    headers: {},
    https_redirect_status_code: '426',
    regex_priority: 0,
    strip_path: true,
    path_handling: 'v0',
    preserve_host: false,
    request_buffering: true,
    response_buffering: true,
    tags: ['user-level', 'low-priority'],
    service: '',
    snis: [],
    sources: [],
    destinations: []
};

export default RouteModel;
