'use strict';

import * as _ from '../lib/core-toolkit.js';

const requiredFields = {
    config: [
        {displayText: 'Nginx Configuration', fieldName: 'nginx_conf', nodeType: 'input__text'},
        {displayText: 'Kong Configuration', fieldName: 'nginx_kong_conf', nodeType: 'input__text'},
        {displayText: 'Stream Configuration', fieldName: 'nginx_kong_stream_conf', nodeType: 'input__text'},
        {displayText: 'Nginx Process Id', fieldName: 'nginx_pid', nodeType: 'input__text'},
        {displayText: 'Nginx Configuration', fieldName: 'nginx_conf', nodeType: 'input__text'},
        {displayText: 'Nginx Configuration', fieldName: 'nginx_conf', nodeType: 'input__text'}
    ],
    logs: [
        {displayText: 'Nginx Access Logs', fieldName: 'nginx_acc_logs', nodeType: 'input__text'},
        {displayText: 'Nginx Error Logs', fieldName: 'nginx_err_logs', nodeType: 'input__text'},
        {displayText: 'Proxy Access Logs', fieldName: 'proxy_access_log', nodeType: 'input__text'},
        {displayText: 'Proxy Error Logs', fieldName: 'proxy_error_log', nodeType: 'input__text'},
        {displayText: 'Admin Access Logs', fieldName: 'admin_acc_logs', nodeType: 'input__text'},
        {displayText: 'Admin Error Log', fieldName: 'admin_error_log', nodeType: 'input__text'}
    ],
    certificates: [
        {displayText: 'SSL Certificates', fieldName: 'ssl_cert', nodeType: 'input__text'},
        {displayText: 'SSL Keys', fieldName: 'ssl_cert_key', nodeType: 'input__text'},
        {displayText: 'Admin Certificates', fieldName: 'admin_ssl_cert', nodeType: 'input__text'},
        {displayText: 'Admin Keys', fieldName: 'admin_ssl_cert_key', nodeType: 'input__text'}
    ]
};

/**
 * Provides controller constructor for displaying node configuration.
 *
 * @constructor
 * @param {Object} scope - Injected scope object.
 * @param {RESTClientFactory} restClient - Customised HTTP REST client factory.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 * @param {ToastFactory} toast - Factory for displaying notifications.
 */
export default function NodeConfigController(scope, restClient, viewFrame, toast) {
    scope.requiredFields = requiredFields;
    scope.fieldValues = {};

    scope.memSharedDicts = [];

    scope.fetchNodeInfo = function () {
        const request = restClient.get('/');

        request.then(({data: response}) => {
            scope.fieldValues = response.configuration;
            scope.stringValue = JSON.stringify(scope.fieldValues, null, 4);
        });

        request.catch(() => {
            toast.error('Unable to fetch node configuration.');
        });
    };

    scope.fetchNodeStatus = function () {
        const request = restClient.get('/status');

        request.then(({data: response}) => {
            const {lua_shared_dicts: sharedDicts = {}} = response.memory;

            for (let name in sharedDicts) {
                let entity = sharedDicts[name];

                /* TODO : Handle size units (MiB) and fractions properly. */
                let [allocated] = entity.allocated_slabs.split(' ');
                let [available] = entity.capacity.split(' ');

                let fillPercent = Math.ceil((parseFloat(allocated) / parseFloat(available)) * 100);
                fillPercent = Math.min(Math.max(fillPercent + 5, 5), 100);

                entity.displayText = _.snakeToDisplayText(name);
                entity.fillPercent = `${fillPercent}%`;

                scope.memSharedDicts.push(entity);
            }
        });

        request.catch(() => {
            toast.error('Unable to populate node health.');
        });
    };

    viewFrame.setTitle('Configuration');
    viewFrame.clearBreadcrumbs();
    viewFrame.addBreadcrumb('#!/node-config', 'Configuration');

    scope.fetchNodeInfo();
    scope.fetchNodeStatus();

    scope.$on('$destroy', () => {
        scope.requiredFields = null;
        scope.fieldValues = null;
        scope.stringValue = '';
    });
}
