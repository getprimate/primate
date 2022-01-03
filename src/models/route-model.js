'use strict';

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
