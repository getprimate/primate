/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import {urlQuery, urlOffset} from '../../lib/rest-utils.js';

/**
 * Provides controller constructor for editing consumer objects.
 *
 * @constructor
 *
 * @param {Object} scope - Injected scope object.
 * @param {RESTClientFactory} restClient - Customised HTTP REST client factory.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 * @param {ToastFactory} toast - Factory for displaying notifications.
 */
export default function ConsumerListController(scope, restClient, viewFrame, toast) {
    scope.consumerList = [];
    scope.consumerNext = {offset: ''};

    /**
     * Retrieves the consumer list.
     *
     * @param {string|object|null} filters - Filters to the Admin API.
     * @return {boolean} True if request could be made, false otherwise.
     */
    scope.fetchConsumerList = function (filters = null) {
        const request = restClient.get('/consumers' + urlQuery(filters));

        viewFrame.setLoaderSteps(1);

        request.then(({data: response}) => {
            scope.consumerNext.offset = urlOffset(response.next);

            for (let consumer of response.data) {
                let createdAt = new Date(consumer.created_at);

                if (consumer.custom_id === null) {
                    consumer.custom_id = 'Not Provided';
                }

                consumer.created_at = createdAt.toLocaleString();

                scope.consumerList.push(consumer);
            }
        });

        request.catch(() => {
            toast.error('Could not load the list of consumers.');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });

        return true;
    };

    viewFrame.clearBreadcrumbs();
    viewFrame.setTitle('Consumers');
    viewFrame.addAction('New Consumer', '#!/consumers/__create__');

    scope.fetchConsumerList();
}
