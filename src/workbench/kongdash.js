/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import RestClientProvider from './services/rest-provider.js';
import LoggerFactory from './services/logger-factory.js';
import ToastFactory from './services/toast-factory.js';
import HttpInterceptorFactory from './services/http-interceptor-factory.js';
import ViewFrameProvider from './services/view-frame-provider.js';

const {angular} = window;
const KongDash = angular.module('KongDash', ['ngRoute']);

function registerInterceptor(httpProvider) {
    httpProvider.interceptors.push('interceptor');
}

KongDash.factory('toast', ['$window', ToastFactory]);
KongDash.factory('logger', LoggerFactory);
KongDash.factory('interceptor', ['$q', 'logger', HttpInterceptorFactory]);

KongDash.config(['$httpProvider', registerInterceptor]);
KongDash.provider('restClient', RestClientProvider);
KongDash.provider('viewFrame', ViewFrameProvider);

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
