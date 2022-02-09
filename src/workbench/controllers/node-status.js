'use strict';

import * as _ from '../../lib/core-toolkit.js';

/**
 * Provides controller constructor for displaying node status.
 *
 * @constructor
 * @param {Object} scope - Injected scope object.
 * @param {RESTClientFactory} restClient - Customised HTTP REST client factory.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 * @param {ToastFactory} toast - Factory for displaying notifications.
 */
export default function NodeStatusController(scope, restClient, viewFrame, toast) {
    scope.memSharedDicts = [];
    scope.memWorkerVMs = [];

    scope.fetchNodeStatus = function () {
        const request = restClient.get('/status');

        request.then(({data: response}) => {
            const {workers_lua_vms: workerVMs = [], lua_shared_dicts: sharedDicts = {}} = response.memory;

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

            scope.memWorkerVMs = workerVMs;
        });

        request.catch(() => {
            toast.error('Unable to populate node health.');
        });
    };

    viewFrame.clearBreadcrumbs();
    viewFrame.addBreadcrumb('#!/health', 'Status');

    scope.fetchNodeStatus();
}
