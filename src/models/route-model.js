'use strict';

const RouteModel = {
    'name': 'my-route',
    'protocols': ['http', 'https'],
    'methods': ['GET', 'POST'],
    'hosts': ['example.com', 'foo.test'],
    'paths': ['/foo', '/bar'],
    'headers': {'x-another-header':['bla'], 'x-my-header':['foo', 'bar']},
    'https_redirect_status_code': 426,
    'regex_priority': 0,
    'strip_path': true,
    'path_handling': 'v0',
    'preserve_host': false,
    'request_buffering': true,
    'response_buffering': true,
    'tags': ['user-level', 'low-priority'],
    'service': {'id':'af8330d3-dbdc-48bd-b1be-55b98608834b'}
};

export default RouteModel;
