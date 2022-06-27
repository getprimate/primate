/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';
import {isText} from '../lib/core-toolkit.js';
import {epochToDate} from '../helpers/date-lib.js';
import {urlQuery, urlOffset, deleteMethodInitiator} from '../helpers/rest-toolkit.js';

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
                    algorithm: upstream.algorithm.toUpperCase(),
                    createdAt: epochToDate(upstream.created_at, viewFrame.getConfig('dateFormat'))
                });
            }
        });

        request.catch(() => {
            toast.error('Unable to fetch upstreams');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });
    };

    /**
     * Deletes the table row entry upon clicking the bin icon.
     *
     * @type {function(Event): boolean}
     */
    scope.deleteTableRow = deleteMethodInitiator(restClient, (err) => {
        if (isText(err)) toast.error(err);
        else toast.success('Upstream deleted successfully.');
    });

    viewFrame.setTitle('Upstreams');

    viewFrame.clearBreadcrumbs();
    viewFrame.addBreadcrumb('/upstreams', 'Upstreams');

    viewFrame.addAction('New Upstream', '#!/upstreams/__create__');

    scope.fetchUpstreamList('/upstreams');

    scope.$on('$destroy', () => {
        scope.upstreamList.length = 0;

        delete scope.upstreamList;
        delete scope.deleteTableRow;
    });
}
