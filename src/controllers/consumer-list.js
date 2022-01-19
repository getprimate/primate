/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

/**
 * Provides controller constructor for editing consumer objects.
 *
 * @constructor
 *
 * @param {Object} scope - The injected scope object.
 * @param {AjaxProvider} ajax - Custom AJAX provider.
 * @param {ViewFrameFactory} viewFrame - Custom view frame factory.
 * @param {ToastFactory} toast - Custom toast message service.
 * @param {LoggerFactory} logger - Custom logger factory service.
 *
 *
 * @property {Object[]} scope.consumerList - An array that holds the list of consumers.
 * @property {string} scope.consumerNext - The resource endpoint with offset value for pagination.
 */
export default function ConsumerListController(scope, ajax, viewFrame, toast, logger) {
    scope.consumerList = [];
    scope.consumerNext = '';

    /**
     * Retrieves the consumer list.
     *
     * @param {string} resource - The consumer API endpoint.
     * @returns {boolean} True if th request could be made, false otherwise.
     */
    scope.fetchConsumerList = function (resource = '/consumers') {
        const request = ajax.get({resource: resource});

        request.then(({data: response, httpText}) => {
            let {next} = response;
            scope.consumerNext = typeof next === 'string' ? next.replace(viewFrame.host, '') : '';

            for (let consumer of response.data) {
                let createdAt = new Date(consumer.created_at);

                if (consumer.custom_id === null) {
                    consumer.custom_id = 'Not Provided';
                }

                consumer.created_at = createdAt.toLocaleString();

                scope.consumerList.push(consumer);
            }

            logger.info(httpText);
        });

        request.catch(({data: error, httpText}) => {
            toast.error('Could not load the list of consumers.');
            logger.exception(httpText, error);
        });

        return true;
    };

    viewFrame.title = 'Consumers';
    viewFrame.prevUrl = '';

    scope.fetchConsumerList();

    viewFrame.actionButtons.push({
        displayText: 'New Consumer',
        target: 'consumer',
        url: '/consumers',
        redirect: '#!/consumers/__create__',
        styles: 'btn success create'
    });
}
