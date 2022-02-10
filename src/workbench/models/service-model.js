/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

/**
 * @typedef {Object} ServiceModel - The service model object
 *
 * @property {string} host - The host of the upstream server. Note that the host value is case-sensitive.
 * @property {number} port - The upstream server port.
 * @property {string} name - The Service name.
 * @property {boolean} enabled - Whether the Service is active.
 * @property {number} retries - The number of retries to execute upon failure to proxy. Default: 5.
 * @property {string} protocol - The protocol used to communicate with the upstream.
 * @property {string} path - The path to be used in requests to the upstream server.
 * @property {number} connect_timeout - The timeout in milliseconds for establishing a connection to the upstream server.
 * @property {number} write_timeout - The timeout in milliseconds between two successive write operations for transmitting a request to the upstream server.
 * @property {number} read_timeout - The timeout in milliseconds between two successive read operations for transmitting a request to the upstream server.
 * @property {string} client_certificate - Certificate to be used as client certificate while TLS handshaking to the upstream server.
 * @property {string|null|boolean} tls_verify - Whether to enable verification of upstream server TLS certificate.
 * @property {number|null} tls_verify_depth - Maximum depth of chain while verifying Upstream server’s TLS certificate.
 * @property {string[]} tags - An optional set of strings associated with the Service for grouping and filtering.
 */

/**
 * Defines the service object with default values.
 *
 * @type {ServiceModel}
 */
const serviceModel = {
    name: '',
    enabled: true,
    retries: 5,
    protocol: 'http',
    host: '',
    port: 80,
    path: '/',
    connect_timeout: 60000,
    write_timeout: 60000,
    read_timeout: 60000,
    client_certificate: '__none__',
    tls_verify: 'nginx',
    tls_verify_depth: -1,
    ca_certificates: [],
    tags: []
};

export default serviceModel;
