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
 *
 * @param {Window} window
 * @param {Object} scope
 * @param {*} ajax
 * @param {K_ViewFrame} viewFrame
 * @param {K_Toast} toast
 * @param {K_Logger} logger
 */
export default function HeaderController(window, scope, ajax, viewFrame, toast, logger) {
    scope.frameState = viewFrame.getState();

    scope.redirectRoute = function (event) {
        const {currentTarget: button} = event;
        const {redirect} = button.dataset;

        event.preventDefault();

        if (typeof redirect !== 'string' || redirect.length === 0) return false;

        viewFrame.getNextRoute();
        window.location.href = redirect;

        return true;
    };

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

            const request = ajax.delete({endpoint});

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
