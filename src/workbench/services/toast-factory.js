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
 * @property {(function(level: string,
 *      message: string): void)} message - Displays a toast message of the specified level.
 * @property {(function(message: string): void)} success - Displays a success toast message.
 * @property {(function(message: string): void)} info - Displays an information toast message.
 * @property {(function(message: string): void)} warning - Displays a warning toast message.
 * @property {(function(message: string): void)} error - Displays a success toast message.
 */

/**
 * Holds the current state of the toast service.
 *
 * @type {Object}
 */
const TOAST_STATE = {
    element: null,
    timeout: null
};

/**
 * Clears the timeout and resets the state.
 */
function removeTimer() {
    if (TOAST_STATE.timeout === null) return false;

    clearTimeout(TOAST_STATE.timeout);
    TOAST_STATE.timeout = null;

    return true;
}

function removePopup() {
    if (TOAST_STATE.element === null) return false;

    TOAST_STATE.element.remove();
    TOAST_STATE.element = null;

    return true;
}

function createPopup(level, message) {
    const {document} = window;
    let shouldAppend = false;

    /* Re-use the DIV if popup is already displayed on the screen. */
    if (TOAST_STATE.element === null) {
        TOAST_STATE.element = document.createElement('div');
        TOAST_STATE.element.classList.add('notification');
        TOAST_STATE.element.addEventListener('click', removePopup);

        shouldAppend = true;
    } else {
        /* Remove previous colour style classes if element is already present. */
        TOAST_STATE.element.classList.remove(['critical', 'success', 'warning', 'info']);
    }

    removeTimer();

    switch (level) {
        case 'ERROR':
            TOAST_STATE.element.innerHTML = '<b>Error!</b>';
            TOAST_STATE.element.classList.add('critical');
            break;

        case 'SUCCESS':
            TOAST_STATE.element.innerHTML = '<b>Success!</b>';
            TOAST_STATE.element.classList.add('success');
            break;

        case 'WARN':
            TOAST_STATE.element.innerHTML = '<b>Warning!</b>';
            TOAST_STATE.element.classList.add('warning');
            break;

        default:
            TOAST_STATE.element.innerHTML = '<b>Message!</b>';
            TOAST_STATE.element.classList.add('info');
            break;
    }

    TOAST_STATE.element.innerText = message;
    TOAST_STATE.timeout = setTimeout(removePopup, 5000);

    if (shouldAppend === true) {
        document.body.appendChild(TOAST_STATE.element);
    }

    return TOAST_STATE.element;
}

/**
 * Returns the {@link ToastFactory toast factory} singleton.
 *
 * @returns {ToastFactory} The toast factory service.
 */
export default function ToastFactory() {
    return {
        message(level, message) {
            createPopup(level, message);
        },

        success(message) {
            createPopup('SUCCESS', message);
        },

        info(message) {
            createPopup('INFO', message);
        },

        warning(message) {
            createPopup('WARN', message);
        },

        error(message) {
            createPopup('ERROR', message);
        }
    };
}
