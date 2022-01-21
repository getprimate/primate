/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

/**
 * A factory service to share data between controllers.
 *
 * View frames are primarily consumed by header and footer controllers.
 * Values could be set from any controller.
 *
 * @typedef {Object} K_ViewFrame
 * @property {function} addHistory - Adds an entry to the navigation history.
 * @property {function} setTitle - Sets the current view title.
 * @property {function} addAction - Adds an action to be displayed on the header.
 * @property {function} getActions - Returns the action buttons.
 * @property {function} getState - Returns the view frame state.
 */

/**
 * Holds the current view frame state.
 *
 * @type {Object}
 * @property {string} frameTitle - The current frame title.
 * @property {string[]} navHistory - An array containing the navigation history.
 * @property {string} serverHost - The current server host.
 * @property {object[]} actionButtons - Holds buttons to be displayed on the header
 */
const _frameState = {
    frameTitle: '',
    navHistory: [],
    serverHost: '',
    actionButtons: []
};

/**
 * Returns the {@link K_ViewFrame View frame} singleton.
 *
 * @returns {K_ViewFrame} The view frame singleton.
 */
export default function ViewFrameFactory() {
    return {
        addHistory(path) {
            _frameState.navHistory.push(path);
        },

        setTitle(title) {
            _frameState.frameTitle = title;
        },

        addAction(displayText, endpoint, target = 'object', redirect = '!#/', styles = 'success create') {
            _frameState.actionButtons.push({
                displayText,
                endpoint,
                target,
                redirect,
                styles
            });
        },

        getActions() {
            return _frameState.actionButtons;
        },

        getState() {
            return _frameState;
        }
    };
}
