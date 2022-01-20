/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

/**
 * @typedef {Object} K_ToastFactory - Toast message factory service.
 *
 * @property {function} message - Displays a toast message of specified level.
 * @property {function} success - Displays a success toast message.
 * @property {function} info - Displays an information toast message.
 * @property {function} warning - Displays a warning toast message.
 * @property {function} error - Displays a success toast message.
 */

/**
 * Holds the current state of the toast service.
 *
 * @type {{interval: any}}
 */
const TOAST_STATE = {
    interval: null
};

/**
 * Returns the [toast factory]{@link K_ToastFactory} singleton.
 *
 * @param {Window} window - The top level window object.
 * @returns {K_ToastFactory} The toast factory service.
 */
export default function ToastFactory(window) {
    const {angular, document} = window;

    return {
        message(level, message) {
            const body = angular.element(document.body);
            const popup = angular.element('<div></div>', {class: 'notification'});

            /* Remove previously created toast messages. */
            if (body.children('.notification').length > 0) {
                body.children('.notification').remove();
            }

            popup.on('click', () => {
                popup.fadeOut(200);
            });

            switch (level) {
                case 'ERROR':
                    popup.html(`<b>Error!</b> ${message}`);
                    popup.addClass('danger');
                    break;

                case 'SUCCESS':
                    popup.html(`<b>Success!</b> ${message}`);
                    popup.addClass('success');
                    break;

                case 'WARN':
                    popup.html(`<b>Warning!</b> ${message}`);
                    popup.addClass('warning');
                    break;

                default:
                    popup.html(`<b>Message!</b> ${message}`);
                    popup.addClass('info');
                    break;
            }

            body.append(popup);

            TOAST_STATE.interval = setInterval(() => {
                popup.fadeOut({
                    duration: 1000,
                    complete: () => {
                        clearInterval(TOAST_STATE.interval);
                    }
                });
            }, 4000);

            return true;
        },

        success(message) {
            this.message('SUCCESS', message);
        },

        info(message) {
            this.message('INFO', message);
        },

        warning(message) {
            this.message('WARN', message);
        },

        error(message) {
            this.message('ERROR', message);
        }
    };
}
