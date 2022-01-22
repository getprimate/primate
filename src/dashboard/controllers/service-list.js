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
 * Provides controller constructor for listing services.
 *
 * @constructor
 *
 * @param {Window} window- window DOM object
 * @param {Object} scope - injected scope object
 * @param {K_Ajax} ajax - custom AJAX provider
 * @param {K_ViewFrame} viewFrame - custom view frame factory
 * @param {K_Toast} toast - custom toast message service
 * @param {K_Logger} logger - custom logger factory
 *
 * @property {function} scope.toggleServiceState - Handles click events on action buttons on table rows.
 */
export default function ServiceListController(window, scope, ajax, viewFrame, toast, logger) {
    scope.serviceList = [];
    scope.serviceNext = '';

    /**
     * Retrieves the list of services.
     *
     * @param {string} endpoint - The resource endpoint.
     * @return {boolean} true if request could be made, false otherwise
     */
    scope.fetchServiceList = (endpoint) => {
        const request = ajax.get({endpoint});

        request.then(({data: response, config: httpConfig, status: statusCode, statusText}) => {
            scope.serviceNext = typeof response.next === 'string' ? response.next.replace(new RegExp(viewFrame.host), '') : '';

            for (let service of response.data) {
                service.displayText = typeof service.name === 'string' ? service.name : `${service.host}:${service.port}`;
                scope.serviceList.push(service);
            }

            logger.info({source: 'http-response', httpConfig, statusCode, statusText});
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

        if (target.nodeName !== 'SPAN' || !target.classList.contains('state-highlight')) {
            return false;
        }

        const {attribute, serviceId} = target.dataset;
        const request = ajax.patch({
            endpoint: `/services/${serviceId}`,
            data: {[attribute]: !target.classList.contains('success')}
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
            logger.info({source: 'http-response', httpConfig, statusCode, statusText});
        });

        request.catch(({data: exception, config: httpConfig, status: statusCode, statusText}) => {
            toast.error('Could not update service state.');
            logger.error({source: 'admin-error', statusCode, statusText, httpConfig, exception});
        });

        return true;
    };

    viewFrame.clearRoutes();
    viewFrame.setTitle('Services');
    viewFrame.addAction('New Service', '#!/services/__create__');

    scope.fetchServiceList('/services');
}
