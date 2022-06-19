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

const {angular, document} = window;
const app = angular.module('Primate', ['ngRoute']);

function registerInterceptor(httpProvider) {
    httpProvider.interceptors.push('interceptor');
}

app.factory('toast', [ToastFactory]);
app.factory('logger', LoggerFactory);
app.factory('interceptor', ['$q', 'logger', HttpInterceptorFactory]);

app.config(['$httpProvider', registerInterceptor]);
app.provider('restClient', RestClientProvider);
app.provider('viewFrame', ViewFrameProvider);

/**
 * Converts first letter of a string to uppercase and
 * replaces underscores with whitespaces.
 */
app.filter('pgname', () => {
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
app.filter('capitalise', () => {
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
app.filter('splice', () => {
    return function (input) {
        if (typeof input !== 'object') {
            return '';
        }

        return input.join(', ');
    };
});

export default {
    /**
     *
     * @param {function} constructorFunc
     * @param {string} dependencies
     */
    controller(constructorFunc, ...dependencies) {
        const bindList = ['$scope'];

        if (Array.isArray(dependencies)) {
            for (let dependency of dependencies) {
                bindList.push(dependency);
            }
        }

        bindList.push(constructorFunc);

        app.controller(constructorFunc.name, bindList);
    },

    /**
     *
     * @param {function} configFunc
     * @param {string} providers
     */
    config(configFunc, ...providers) {
        const argList = [];

        if (Array.isArray(providers)) {
            for (let name of providers) {
                argList.push(`${name}Provider`);
            }
        }

        argList.push(configFunc);

        app.config(argList);
    },

    /**
     *
     * @param {function} directiveFunc
     */
    directive(directiveFunc) {
        const name = directiveFunc.name.charAt(0).toLowerCase() + directiveFunc.name.substring(1);
        app.directive(name.replace('Directive', ''), [directiveFunc]);
    },

    onReady(readyFunc, ...dependencies) {
        const bindList = [];

        if (Array.isArray(dependencies)) {
            for (let dependency of dependencies) {
                bindList.push(dependency);
            }
        }

        bindList.push(readyFunc);
        app.run(bindList);
    },

    start() {
        angular.bootstrap(document, ['Primate']);
    }
};
