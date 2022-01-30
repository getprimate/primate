/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import {urlQuery, urlOffset} from '../../lib/rest-utils.js';

/**
 * Provides controller constructor for listing upstream objects.
 *
 * @constructor
 * @param {Object} scope - Injected scope object.
 * @param {RESTClientFactory} restClient - Customised HTTP REST client factory.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 * @param {ToastFactory} toast - Factory for displaying notifications.
 */
export default function UpstreamListController(scope, restClient, viewFrame, toast) {
    scope.upstreamList = [];
    scope.upstreamNext = {offset: ''};

    /**
     * Retrieves the list of upstream objects.
     *
     * @param {string|object|null} filters - Filters to the Admin API.
     * @return {boolean} True if request could be made, false otherwise.
     */
    scope.fetchUpstreamList = (filters = null) => {
        const request = restClient.get('/upstreams' + urlQuery(filters));

        viewFrame.setLoaderSteps(1);

        request.then(({data: response}) => {
            scope.upstreamNext.offset = urlOffset(response.next);

            for (let upstream of response.data) {
                scope.upstreamList.push({
                    id: upstream.id,
                    name: upstream.name,
                    algorithm: upstream.algorithm,
                    created_at: upstream.created_at
                });
            }
        });

        request.catch(() => {
            toast.error('Could not load upstreams');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });
    };

    viewFrame.setTitle('Upstreams');
    viewFrame.clearBreadcrumbs();

    viewFrame.addAction('New Upstream', '#!/upstreams/__create__');

    scope.fetchUpstreamList('/upstreams');
}
