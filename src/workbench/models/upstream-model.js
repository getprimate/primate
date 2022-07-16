/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

/**
 * The upstream model object.
 *
 * @typedef {Object} UpstreamModel
 * @property {string} name - Name
 * @property {string} hash_on - Hash on
 * @property {string} hash_on_value - Hash on value
 * @property {string} hash_fallback_value - Hash fallback value
 * @property {string} hash_fallback - Hash on
 * @property {string|Object} host_header - Hash on
 * @property {string[]} tags - Tags
 * @property {{active: { healthy: Object, unhealthy: Object },
 *      passive: { healthy: Object, unhealthy: Object }}} healthchecks - Health check options
 * @property {string|Object} client_certificate - The certificate to be used as client certificate while TLS handshaking to the upstream server
 */

/**
 * @type {UpstreamModel}
 */
const upstreamModel = {
    name: '',
    algorithm: 'round-robin',
    hash_on: 'none',
    hash_on_value: '',
    hash_fallback: 'none',
    hash_fallback_value: '',
    slots: 10000,
    healthchecks: {
        passive: {
            type: 'http',
            healthy: {
                successes: 0,
                http_statuses: []
            },
            unhealthy: {
                tcp_failures: 0,
                http_statuses: [],
                http_failures: 0,
                timeouts: 0
            }
        },
        active: {
            http_path: '/',
            timeout: 1,
            concurrency: 10,
            https_sni: '',
            type: 'http',
            healthy: {
                interval: 0,
                http_statuses: [],
                successes: 0
            },
            https_verify_certificate: true,
            unhealthy: {
                tcp_failures: 0,
                http_statuses: [],
                http_failures: 0,
                interval: 0,
                timeouts: 0
            }
        },
        threshold: 0
    },
    tags: [],
    host_header: '',
    client_certificate: '__none__'
};

export default upstreamModel;
