/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

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
    client_certificate: ''
};

export default upstreamModel;
