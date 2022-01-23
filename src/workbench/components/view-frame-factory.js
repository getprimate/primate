/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

/**
 * An injectable factory service to share data between controllers.
 *
 * View frames are primarily consumed by header and footer controllers.
 * Values could be set from any controller.
 *
 * @typedef {Object} ViewFrameFactory
 * @property {(function(string):void)} addRoute - Adds an entry to the route history.
 * @property {(function(void):void)} clearRoutes - Clears the route history stack.
 * @property {(function(void): string[])} getRoutes - Returns the route history stack.
 * @property {(function(boolean): string)} getNextRoute - Pops the next route from history stack.
 * @property {(function(string): void)} setTitle - Sets the current view title.
 * @property {(function(displayText:string, redirect:string=, styles:string=,
 *      target:string=, endpoint:string=):void)} addAction - Adds an action to be displayed on the header.
 * @property {(function(void): object[])} getActions - Returns the action buttons.
 * @property {(function(void):void)} clearActions - Clears action buttons.
 * @property {(function(void): Object)} getState - Returns the view frame state.
 * @property {(function(number):void)} setLoaderStep - Sets the loader step with respect to viewport width.
 * @property {(function(void):void)} resetLoader - Clears loader step and sets width to zero.
 * @property {function(void):void} incrementLoader - Increments loader width by adding loader step.
 */

/**
 * Holds the current view frame state.
 *
 * @type {Object}
 */
const frameState = {
    frameTitle: '',
    routeNext: '',
    routeHistory: [],
    serverHost: '',
    actionButtons: [],
    loaderWidth: 0,
    loaderStep: 50,
    loaderUnit: '0vw'
};

/**
 * Returns the {@link ViewFrameFactory View frame} singleton.
 *
 * @returns {ViewFrameFactory} The view frame singleton.
 */
export default function ViewFrameFactory() {
    return {
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

        addRoute(route) {
            frameState.routeNext = route;
            frameState.routeHistory.push(route);
        },

        clearRoutes() {
            frameState.routeHistory.splice(0);
            frameState.routeNext = '';
        },

        getRoutes() {
            return frameState.routeHistory;
        },

        hasNextRoute() {
            return frameState.routeHistory.length >= 1;
        },

        getNextRoute(shouldPop = true) {
            if (shouldPop === false) return frameState.routeNext;

            if (frameState.routeHistory.length === 0) frameState.routeNext = '';
            else frameState.routeNext = frameState.routeHistory.pop();

            return frameState.routeNext;
        },

        setLoaderStep(step) {
            if (frameState.loaderWidth === 0) {
                frameState.loaderStep = Math.ceil(step);
                frameState.loaderWidth = 1;
                frameState.loaderUnit = `${frameState.loaderWidth}vw`;
            }
        },

        incrementLoader() {
            const width = frameState.loaderWidth + frameState.loaderStep;

            if (width >= 100) {
                frameState.loaderStep = 0;
                frameState.loaderWidth = 0;
            } else {
                frameState.loaderWidth = width;
            }

            frameState.loaderUnit = `${frameState.loaderWidth}vw`;
        },

        resetLoader() {
            frameState.loaderStep = 0;
            frameState.loaderWidth = 0;
            frameState.loaderUnit = `${frameState.loaderWidth}vw`;
        },

        getState() {
            return frameState;
        }
    };
}
