/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import {isNil, isText} from '../lib/core-toolkit.js';
import {urlQuery, urlOffset, deleteMethodInitiator, simplifyObjectId} from '../helpers/rest-toolkit.js';
import {epochToDate} from '../helpers/date-lib.js';

/**
 * Provides controller constructor for editing consumer objects.
 *
 * @constructor
 * @param {Object} scope - Injected scope object.
 * @param {RESTClientFactory} restClient - Customised HTTP REST client factory.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 * @param {ToastFactory} toast - Factory for displaying notifications.
 */
export default function ConsumerListController(scope, restClient, viewFrame, toast) {
    scope.consumerList = [];
    scope.consumerNext = {offset: ''};

    /**
     * Retrieves the list of consumers.
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
                consumer.displayText = isText(consumer.username) ? consumer.username : simplifyObjectId(consumer.id);

                if (isNil(consumer.custom_id)) {
                    consumer.custom_id = '- Not Provided -';
                }

                consumer.createdAt = epochToDate(consumer.created_at, viewFrame.getConfig('dateFormat'));
                scope.consumerList.push(consumer);
            }
        });

        request.catch(() => {
            toast.error('Unable to fetch consumers.');
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
        else toast.success('Consumer deleted successfully.');
    });

    viewFrame.clearBreadcrumbs();
    viewFrame.addBreadcrumb('#!/consumers', 'Consumers');
    viewFrame.setTitle('Consumers');
    viewFrame.addAction('New Consumer', '#!/consumers/__create__');

    scope.fetchConsumerList();

    scope.$on('$destroy', () => {
        scope.consumerList.length = 0;

        delete scope.consumerList;
        delete scope.fetchConsumerList;
        delete scope.deleteTableRow;
    });
}
