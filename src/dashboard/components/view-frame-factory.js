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
 * @property {function} clearHistory - Clears the history stack.
 * @property {function} getHistory - Returns the history stack.
 * @property {function} nextHistory - Pops the next history from stack.
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
 * @property {string[]} routeHistory - An array containing the navigation history.
 * @property {string} serverHost - The current server host.
 * @property {object[]} actionButtons - Holds buttons to be displayed on the header
 */
const frameState = {
    frameTitle: '',
    routeNext: '',
    routeHistory: [],
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
        addHistory(route) {
            frameState.routeNext = route;
            frameState.routeHistory.push(route);
        },

        clearHistory() {
            frameState.routeHistory.splice(0);
            frameState.routeNext = '';
        },

        getHistory() {
            return frameState.routeHistory;
        },

        hasNextRoute() {
            return frameState.routeHistory.length >= 1;
        },

        getNextRoute() {
            if (frameState.routeHistory.length === 0) frameState.routeNext = '';
            else frameState.routeNext = frameState.routeHistory.pop();

            return frameState.routeNext;
        },

        setTitle(title) {
            frameState.frameTitle = title;
        },

        addAction(displayText, redirect = '!#/', styles = 'success create', target = 'object', endpoint = '!#/') {
            frameState.actionButtons.push({
                styles: `btn ${styles}`,
                displayText,
                redirect,
                target,
                endpoint
            });
        },

        getActions() {
            return frameState.actionButtons;
        },

        clearActions() {
            frameState.actionButtons.splice(0);
        },

        getState() {
            return frameState;
        }
    };
}
