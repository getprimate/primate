/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import _ from '../../lib/core-utils.js';
import {deleteMethodInitiator} from '../helpers/rest-toolkit.js';
import {urlQuery, urlOffset} from '../../lib/rest-utils.js';

/**
 * Provides controller constructor for listing services.
 *
 * @constructor
 * @param {Object} scope - Injected scope object.
 * @param {RESTClientFactory} restClient - Customised HTTP REST client factory.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 * @param {ToastFactory} toast - Factory for displaying notifications.
 */
export default function ServiceListController(scope, restClient, viewFrame, toast) {
    scope.serviceList = [];
    scope.serviceNext = {offset: ''};

    /**
     * Handles click events on action buttons on table rows.
     *
     * @private
     * @param {Event} event - The event object.
     * @param {HTMLInputElement} event.target - The input HTML element.
     * @return {boolean} True if event handled, false otherwise.
     */
    scope._toggleServiceState = function (event) {
        const {target} = event;
        const {attribute, serviceId} = target.dataset;

        const request = restClient.patch(`/services/${serviceId}`, {[attribute]: target.checked});

        request.then(() => {
            toast.success('Service state updated.');
        });

        request.catch(() => {
            toast.error('Could not update service state.');
        });

        return true;
    };

    /**
     * Deletes the table row entry upon clicking the bin icon.
     *
     * @private
     * @type {function(Event): boolean}
     */
    scope._deleteTableRow = deleteMethodInitiator(restClient, (err) => {
        if (_.isText(err)) toast.error(err);
        else toast.success('Service deleted successfully.');
    });

    /**
     * Retrieves the list of services.
     *
     * @param {string|object|null} filters - Filters to the Admin API.
     * @return {boolean} True if request could be made, false otherwise.
     */
    scope.fetchServiceList = function (filters = null) {
        const request = restClient.get('/services' + urlQuery(filters));

        viewFrame.setLoaderSteps(2);
        viewFrame.incrementLoader();

        request.then(({data: response}) => {
            scope.serviceNext.offset = urlOffset(response.next);

            for (let service of response.data) {
                service.displayText =
                    typeof service.name === 'string' ? service.name : `${service.host}:${service.port}`;
                scope.serviceList.push(service);
            }
        });

        request.catch(() => {
            toast.error('Could not load list of services');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });

        return true;
    };

    /**
     * Handles click events on the table widgets.
     *
     * @param {Event} event - The current event object
     * @return {boolean} True if event handled, false otherwise
     */
    scope.handleTableClickEvents = function (event) {
        const {target} = event;

        if (target.nodeName === 'INPUT' && target.type === 'checkbox') return scope._toggleServiceState(event);
        else return scope._deleteTableRow(event);
    };

    viewFrame.clearBreadcrumbs();
    viewFrame.setTitle('Services');
    viewFrame.addBreadcrumb('#!/services', 'Services');
    viewFrame.addAction('New Service', '#!/services/__create__');

    scope.fetchServiceList();
}
