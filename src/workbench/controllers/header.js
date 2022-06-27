/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import {isText} from '../lib/core-toolkit.js';

/**
 * Provides controller constructor for handling the header bar.
 *
 * @constructor
 * @param {Object} scope - Injected scope object.
 * @param {RESTClientFactory} restClient - Customised HTTP REST client factory.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 * @param {ToastFactory} toast - Factory for displaying notifications.
 */
export default function HeaderController(scope, restClient, viewFrame, toast) {
    scope.frameState = viewFrame.getState();
    scope.frameConfig = viewFrame.getFrameConfig();

    /**
     * Handles click events navigation button.
     *
     * @param {Event} event - Current DOM event object.
     * @returns {boolean} False if redirect did not happen.
     */
    scope.handleRedirects = function (event) {
        const {currentTarget: element, target} = event;
        const {redirect} = isText(target.dataset.redirect) ? target.dataset : element.dataset;

        event.preventDefault();

        if (!isText(redirect) || redirect.length === 0) {
            return false;
        }

        window.location.href = redirect.substring(0, 1) === '#!' ? redirect : `#!${redirect}`;
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

            request.then(() => {
                toast.success(`${target} deleted.`);
                window.location.href = redirect;
            });

            request.catch(() => {
                toast.error(`Unable to delete ${target}.`);
            });
        }

        if (button.classList.contains('btn') && button.classList.contains('create')) {
            window.location.href = redirect;
        }

        return true;
    };
}
