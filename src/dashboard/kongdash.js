/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import RestClientProvider from './components/rest-provider.js';
import LoggerFactory from './components/logger-factory.js';
import ToastFactory from './components/toast-factory.js';
import ViewFrameFactory from './components/view-frame-factory.js';

const {angular} = window;
const KongDash = angular.module('KongDash', ['base64', 'ngRoute', 'ngAnimate']);

KongDash.provider('restClient', ['$base64', RestClientProvider]);

KongDash.factory('toast', ['$window', ToastFactory]);
KongDash.factory('logger', LoggerFactory);
KongDash.factory('viewFrame', ViewFrameFactory);

/**
 * Converts first letter of a string to uppercase and
 * replaces underscores with whitespaces.
 */
KongDash.filter('pgname', () => {
    return function (input) {
        if (typeof input !== 'string') {
            return '';
        }

        return (input.charAt(0).toUpperCase() + input.substr(1).toLowerCase()).split('_').join(' ');
    };
});

/**
 * Converts first letter of a string to uppercase and
 * replaces underscores and hyphens with whitespaces.
 */
KongDash.filter('capitalise', () => {
    return function (input) {
        if (typeof input !== 'string') {
            return '';
        }

        const words = input.split(/[_,-]+/);

        return words
            .map((word) => {
                return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
            })
            .join(' ');
    };
});

/**
 * Strips protocol (http:// or https://) from URL.
 */
KongDash.filter('stripProtocol', () => {
    return function (input) {
        if (!input) return '';

        if (input.indexOf('s://') > 1) return input.split('https://')[1];

        return input.split('http://')[1] || '';
    };
});

/**
 * Joins a string array with commas.
 */
KongDash.filter('splice', () => {
    return function (input) {
        if (typeof input !== 'object') {
            return '';
        }

        return input.join(', ');
    };
});

export default KongDash;
