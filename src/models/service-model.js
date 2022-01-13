/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

/**
 * @typedef {Object} App_ServiceModel - The service model object
 *
 * @property {string} [name] - The Service name.
 * @property {number} [retries] - The number of retries to execute upon failure to proxy. Default: 5.
 * @property {string} protocol - The protocol used to communicate with the upstream.
 * @property {string} host - The host of the upstream server. Note that the host value is case-sensitive.
 * @property {number} port - The upstream server port.
 * @property {string} [path] - Optional: The path to be used in requests to the upstream server.
 * @property {string} [client_certificate] - Certificate to be used as client certificate while TLS handshaking to the upstream server.
 * @property {string[]} [tags] - An optional set of strings associated with the Service for grouping and filtering.
 */

/**
 * Defines the service object.
 *
 * @type App_ServiceModel
 */
const ServiceModel = {
    name: '',
    retries: 5,
    protocol: 'http',
    host: '',
    port: 80,
    path: '/',
    connect_timeout: 60000,
    write_timeout: 60000,
    read_timeout: 60000,
    tags: [],
    client_certificate: '',
    tls_verify: 'default',
    tls_verify_depth: -1,
    ca_certificates: [],
    enabled: true
};

export default ServiceModel;
