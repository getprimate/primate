'use strict';

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
    tls_verify: true,
    tls_verify_depth: null,
    ca_certificates: [],
    enabled: true
};

export default ServiceModel;