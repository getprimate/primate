/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

/**
 * Provides controller constructor for handling the header bar.
 *
 * @constructor
 * @param {Window} window - Top level window object.
 * @param {Object} scope - Injected scope object.
 * @param {RESTClientFactory} restClient - Customised HTTP REST client factory.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 * @param {ToastFactory} toast - Factory for displaying notifications.
 * @param {LoggerFactory} logger - Factory for logging activities.
 */
export default function HeaderController(window, scope, restClient, viewFrame, toast, logger) {
    scope.frameState = viewFrame.getState();

    /**
     * Handles click events navigation button.
     *
     * @param {Event} event - Current DOM event object.
     * @returns {boolean} False if redirect did not happen.
     */
    scope.redirectRoute = function (event) {
        const {currentTarget: button} = event;
        const {redirect} = button.dataset;

        event.preventDefault();

        if (typeof redirect !== 'string' || redirect.length === 0) return false;

        viewFrame.getNextRoute();
        window.location.href = redirect;

        return true;
    };

    /**
     * Handles click events on header action buttons appropriately.
     *
     * @param {Event} event - Current DOM event object.
     * @returns {boolean} False if redirect did not happen.
     */
    scope.handleButtonAction = function (event) {
        const {target: button} = event;

        if (button.nodeName !== 'BUTTON') {
            return false;
        }

        const {target, endpoint, redirect} = button.dataset;

        event.preventDefault();

        if (button.classList.contains('critical') && button.classList.contains('delete')) {
            const proceed = confirm(`Proceed to delete this ${target}?`);

            if (proceed === false) {
                return false;
            }

            const request = restClient.delete(endpoint);

            request.then(({httpText}) => {
                toast.success(`${target} deleted.`);
                logger.info(httpText);

                window.location.href = redirect;
            });

            request.catch(({data: error, httpText}) => {
                toast.error(`Unable to delete ${target}.`);
                logger.exception(httpText, error);
            });
        }

        if (button.classList.contains('btn') && button.classList.contains('create')) {
            window.location.href = redirect;
        }

        return true;
    };
}
