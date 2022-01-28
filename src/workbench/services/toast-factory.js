/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

/**
 * An injectable toast message factory service.
 *
 * @typedef {Object} ToastFactory
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

function createPopup(level, message) {
    const popup = document.createElement('div');
    popup.classList.add('notification');

    popup.addEventListener('click', () => {
        popup.remove();
    });

    switch (level) {
        case 'ERROR':
            popup.innerHTML = '<b>Error!</b>';
            popup.classList.add('critical');
            break;

        case 'SUCCESS':
            popup.innerHTML = '<b>Success!</b>';
            popup.classList.add('success');
            break;

        case 'WARN':
            popup.innerHTML = '<b>Warning!</b>';
            popup.classList.add('warning');
            break;

        default:
            popup.innerHTML = '<b>Message!</b>';
            popup.classList.add('info');
            break;
    }

    popup.innerText = message;

    return popup;
}

/**
 * Returns the {@link ToastFactory toast factory} singleton.
 *
 * @param {Window} window - The top level window object.
 * @returns {ToastFactory} The toast factory service.
 */
export default function ToastFactory(window) {
    const {document} = window;

    return {
        success(message) {
            document.body.appendChild(createPopup('SUCCESS', message));
        },

        info(message) {
            document.body.appendChild(createPopup('INFO', message));
        },

        warning(message) {
            document.body.appendChild(createPopup('WARN', message));
        },

        error(message) {
            document.body.appendChild(createPopup('ERROR', message));
        }
    };
}
