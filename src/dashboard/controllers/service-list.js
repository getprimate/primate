/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

/**
 * Provides controller constructor for listing services.
 *
 * @constructor
 *
 * @param {Window} window- window DOM object
 * @param {Object} scope - injected scope object
 * @param {AjaxProvider} ajax - custom AJAX provider
 * @param {ViewFrameFactory} viewFrame - custom view frame factory
 * @param {ToastFactory} toast - custom toast message service
 * @param {LoggerFactory} logger - custom logger factory
 *
 * @property {function} scope.toggleServiceState - Handles click events on action buttons on table rows.
 */
export default function ServiceListController(window, scope, ajax, viewFrame, toast, logger) {
    scope.serviceList = [];
    scope.serviceNext = '';

    /**
     * Retrieves the list of services.
     *
     * @param {string} resource - the resource endpoint
     * @return {boolean} true if request could be made, false otherwise
     */
    scope.fetchServiceList = (resource) => {
        const request = ajax.get({resource});

        request.then(({data: response, config: httpConfig, status: statusCode, statusText}) => {
            scope.serviceNext = (typeof response.next === 'string') ? response.next.replace(new RegExp(viewFrame.host), '') : '';

            for (let service of response.data) {
                service.displayText = (typeof service.name === 'string') ? service.name : `${service.host}:${service.port}`;
                scope.serviceList.push(service);
            }

            logger.info({ source: 'http-response', httpConfig, statusCode, statusText });
        });

        request.catch(({data: exception, config: httpConfig, status: statusCode, statusText}) => {
            toast.error('Could not load list of services');
            logger.error({source: 'admin-error', statusCode, statusText, httpConfig, exception});
        });

        return true;
    };

    /**
     * Handles click events on action buttons on table rows.
     *
     * @param {Object} event - The event object
     * @return {boolean} True if event handled, false otherwise
     */
    scope.toggleServiceState = (event) => {
        if (typeof event === 'undefined') {
            return false;
        }

        const {target} = event;

        if (target.nodeName !== 'SPAN'
            || !target.classList.contains('state-highlight')) {
            return false;
        }

        const {attribute, serviceId} = target.dataset;
        const request = ajax.patch({
            resource: `/services/${serviceId}`,
            data: { [attribute]: !(target.classList.contains('success')) }
        });

        request.then(({data: response, config: httpConfig, status: statusCode, statusText}) => {
            if (response[attribute] === true) {
                target.classList.remove('default');
                target.classList.add('success');

            } else {
                target.classList.remove('success');
                target.classList.add('default');
            }

            toast.info('Service state updated.');
            logger.info({ source: 'http-response', httpConfig, statusCode, statusText });
        });

        request.catch(({data: exception, config: httpConfig, status: statusCode, statusText}) => {
            toast.error('Could not update service state.');
            logger.error({source: 'admin-error', statusCode, statusText, httpConfig, exception});
        });

        return true;
    };

    viewFrame.title = 'Service List';
    viewFrame.prevUrl = '';

    viewFrame.actionButtons.push({displayText: 'New Service', target: 'service', url: '/services', redirect: '#!/services/__create__', styles: 'btn success create'});

    scope.fetchServiceList('/services');
}
