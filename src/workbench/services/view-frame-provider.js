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
 * @property {(function(redirect: string, displayText: string):void)} addBreadcrumb - Adds an entry to the route history.
 * @property {(function(void):void)} clearBreadcrumbs - Clears the route history stack.
 * @property {(function(void): string[])} getBreadcrumbs - Returns the route history stack.
 * @property {(function(void): Object)} popBreadcrumb - Pops the last breadcrumb.
 * @property {(function(shouldPop: boolean=): string)} previousRoute - Pops the next route from history stack.
 * @property {(function(void): boolean)} hasBreadcrumbs - Tells if the breadcrumbs are present.
 * @property {(function(string): void)} setSessionTheme - Sets the session theme color.
 * @property {(function(string): void)} setTitle - Sets the current view title.
 * @property {(function(displayText:string, redirect:string=, styles:string=,
 *      target:string=, endpoint:string=):void)} addAction - Adds an action to be displayed on the header.
 * @property {(function(void): object[])} getActions - Returns the action buttons.
 * @property {(function(void):void)} clearActions - Clears action buttons.
 * @property {(function(void): Object)} getState - Returns the view frame state.
 * @property {(function(number):ViewFrameFactory)} setLoaderSteps - Sets the loader step with respect to viewport width.
 * @property {(function(void):void)} resetLoader - Clears loader step and sets width to zero.
 * @property {function(void):ViewFrameFactory} incrementLoader - Increments loader width by adding loader step.
 * @property {(function(name: string): void)} getFrameConfig - Finds the configuration value by name.
 */

/**
 * Implements the provider for {@link ViewFrameFactory View Frame factory}.
 *
 * @typedef {Object} ViewFrameProvider
 * @property {(function(options: Object): void)} initialize - Initializes with the provided options.
 */

import * as _ from '../../lib/core-toolkit.js';

const frameCache = {
    isLoading: false
};

/**
 * Holds the current view frame state.
 *
 * @type {Object}
 */
const frameState = {
    sessionTheme: '#FFFFFF',
    frameTitle: '',
    routeNext: '',
    breadcrumbs: [],
    serverHost: '',
    actionButtons: [],
    loaderWidth: 0,
    loaderStep: 50,
    loaderUnit: '0vw'
};

const frameConfig = {
    dateFormat: 'date'
};

function loaderTimeoutCallback(state) {
    state.loaderStep = 0;
    state.loaderWidth = 0;
    state.loaderUnit = `${state.loaderWidth}vw`;

    frameCache.isLoading = false;
}

/**
 * Returns the {@link ViewFrameFactory View frame} singleton.
 *
 * @returns {ViewFrameFactory} The view frame singleton.
 */
function buildViewFrameFactory(timeoutFn) {
    return {
        _setTimeout: timeoutFn,

        setSessionTheme(color) {
            frameState.sessionTheme = color;
        },

        getSessionTheme() {
            return frameState.sessionTheme;
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

        addBreadcrumb(redirect, displayText = null) {
            if (_.isEmpty(displayText)) {
                displayText = redirect;
            }

            frameState.breadcrumbs.push({redirect, displayText});
            frameState.routeNext = frameState.breadcrumbs.length >= 2 ? redirect : '';
        },

        clearBreadcrumbs() {
            frameState.breadcrumbs.splice(0);
            frameState.routeNext = '';
        },

        getBreadcrumbs() {
            return frameState.breadcrumbs;
        },

        hasBreadcrumbs() {
            return frameState.breadcrumbs.length >= 1;
        },

        popBreadcrumb() {
            return frameState.breadcrumbs.pop();
        },

        previousRoute(shouldPop = true) {
            if (shouldPop === false) return frameState.routeNext;

            if (frameState.breadcrumbs.length === 0) {
                frameState.routeNext = '';
            } else {
                frameState.breadcrumbs.pop();
                frameState.routeNext = frameState.breadcrumbs.pop()['redirect'];
            }

            return frameState.routeNext;
        },

        setLoaderSteps(steps) {
            if (frameState.loaderWidth === 0 && steps >= 1) {
                frameState.loaderStep = Math.ceil(100 / steps);
                frameState.loaderWidth = 1;
                frameState.loaderUnit = `${frameState.loaderWidth}vw`;
            }

            return this;
        },

        incrementLoader() {
            const width = Math.min(frameState.loaderWidth + frameState.loaderStep, 100);

            frameState.loaderWidth = width;
            frameState.loaderUnit = `${frameState.loaderWidth}vw`;

            if (width >= 100 && false === frameCache.isLoading) {
                frameCache.isLoading = true;
                this._setTimeout(loaderTimeoutCallback, 500, true, frameState);
            }

            return this;
        },

        resetLoader() {
            frameState.loaderStep = 0;
            frameState.loaderWidth = 0;
            frameState.loaderUnit = `${frameState.loaderWidth}vw`;
        },

        getState() {
            return frameState;
        },

        getFrameConfig(name) {
            return _.isText(frameConfig[name]) ? frameConfig[name] : null;
        }
    };
}

export default function ViewFrameProvider() {
    this.initialize = (options) => {
        for (let name in options) {
            if (!_.isDefined(frameState[name])) {
                continue;
            }

            frameState[name] = options[name];
        }
    };

    this.$get = ['$timeout', buildViewFrameFactory];
}
