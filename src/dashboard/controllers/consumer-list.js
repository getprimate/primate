/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

/**
 * @typedef {import('../components/view-frame-factory.js').K_ViewFrame} K_ViewFrame
 * @typedef {import('../components/toast-factory.js').K_Toast} K_Toast
 * @typedef {import('../components/logger-factory.js').K_Logger} K_Logger
 */

/**
 * Provides controller constructor for editing consumer objects.
 *
 * @constructor
 *
 * @param {Object} scope - The injected scope object.
 * @param {AjaxProvider} ajax - Custom AJAX provider.
 * @param {K_ViewFrame} viewFrame - Custom view frame factory.
 * @param {K_Toast} toast - Custom toast message service.
 * @param {K_Logger} logger - Custom logger factory service.
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
     * @param {string} endpoint - The consumer API endpoint.
     * @returns {boolean} True if th request could be made, false otherwise.
     */
    scope.fetchConsumerList = function (endpoint = '/consumers') {
        const request = ajax.get({endpoint});

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

    viewFrame.setTitle('Consumers');
    viewFrame.clearHistory();
    viewFrame.addAction('New Consumer', '#!/consumers/__create__');

    scope.fetchConsumerList();
}
