/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import restUtils from '../../lib/rest-utils.js';

/**
 * Provides controller constructor for listing services.
 *
 * @constructor
 *
 * @param {Window} window - Top level window object.
 * @param {Object} scope - Injected scope object.
 * @param {RESTClientFactory} restClient - Customised HTTP REST client factory.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 * @param {ToastFactory} toast - Factory for displaying notifications.
 * @param {LoggerFactory} logger - Factory for logging activities.
 *
 * @property {function} scope.toggleServiceState - Handles click events on action buttons on table rows.
 */
export default function ServiceListController(window, scope, restClient, viewFrame, toast, logger) {
    scope.serviceList = [];
    scope.serviceNext = {offset: ''};

    /**
     * Retrieves the list of services.
     *
     * @param {string|object|null} filters - Filters to the Admin API.
     * @return {boolean} True if request could be made, false otherwise.
     */
    scope.fetchServiceList = function (filters = null) {
        const request = restClient.get('/services' + restUtils.urlQuery(filters));

        request.then(({data: response, httpText}) => {
            scope.serviceNext.offset = restUtils.urlOffset(response.next);

            for (let service of response.data) {
                service.displayText = typeof service.name === 'string' ? service.name : `${service.host}:${service.port}`;
                scope.serviceList.push(service);
            }

            logger.info(httpText);
        });

        request.catch(({data: error, httpText}) => {
            toast.error('Could not load list of services');
            logger.exception(httpText, error);
        });

        return true;
    };

    /**
     * Handles click events on action buttons on table rows.
     *
     * @param {Object} event - The event object
     * @return {boolean} True if event handled, false otherwise
     */
    scope.toggleServiceState = function (event) {
        if (typeof event === 'undefined') {
            return false;
        }

        const {target} = event;

        if (target.nodeName !== 'SPAN' || !target.classList.contains('state-highlight')) {
            return false;
        }

        const {attribute, serviceId} = target.dataset;
        const payload = {[attribute]: !target.classList.contains('success')};

        const request = restClient.patch(`/services/${serviceId}`, payload);

        request.then(({data: response, httpText}) => {
            if (response[attribute] === true) {
                target.classList.remove('default');
                target.classList.add('success');
            } else {
                target.classList.remove('success');
                target.classList.add('default');
            }

            toast.info('Service state updated.');
            logger.info(httpText);
        });

        request.catch(({data: error, httpText}) => {
            toast.error('Could not update service state.');
            logger.error(httpText, error);
        });

        return true;
    };

    viewFrame.clearRoutes();
    viewFrame.setTitle('Services');
    viewFrame.addAction('New Service', '#!/services/__create__');

    scope.fetchServiceList();
}
