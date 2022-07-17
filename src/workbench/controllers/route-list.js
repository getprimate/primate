/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import {isText, implode} from '../lib/core-toolkit.js';
import {epochToDate} from '../helpers/date-lib.js';
import {urlQuery, urlOffset, simplifyObjectId, deleteMethodInitiator} from '../helpers/rest-toolkit.js';

/**
 * Provides controller constructor for listing routes.
 *
 * @constructor
 *
 * @param {Object} scope - Injected scope object.
 * @param {RESTClientFactory} restClient - Customised HTTP REST client factory.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 * @param {ToastFactory} toast - Factory for displaying notifications.
 */
export default function RouteListController(scope, restClient, viewFrame, toast) {
    scope.routeList = [];
    scope.routeNext = {offset: ''};

    /**
     * Retrieves the list of route objects.
     *
     * @param {string|object|null} filters - Filters to the Admin API.
     * @return {boolean} True if request could be made, false otherwise.
     */
    scope.fetchRouteList = function (filters = null) {
        const request = restClient.get('/routes' + urlQuery(filters));

        viewFrame.setLoaderSteps(1);

        request.then(({data: response}) => {
            scope.routeNext.offset = urlOffset(response.next);

            for (let route of response.data) {
                scope.routeList.push({
                    id: route.id,
                    displayText: isText(route.name) ? route.name : simplifyObjectId(route.id),
                    protocols: implode(route.protocols),
                    createdAt: epochToDate(route.created_at, viewFrame.getConfig('dateFormat')),
                    pathHandling: route.path_handling
                });
            }
        });

        request.catch(() => {
            toast.error('Could not load list of routes.');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });

        return true;
    };

    /**
     * Deletes the table row entry upon clicking the bin icon.
     *
     * @type {function(Event): boolean}
     */
    scope.deleteTableRow = deleteMethodInitiator(restClient, (err) => {
        if (isText(err)) toast.error(err);
        else toast.success('Route deleted successfully.');
    });

    viewFrame.clearBreadcrumbs();
    viewFrame.setTitle('Routes');
    viewFrame.addBreadcrumb('/routes', 'Routes');
    viewFrame.addAction('New Route', '#!/routes/__create__');

    scope.fetchRouteList();
}
