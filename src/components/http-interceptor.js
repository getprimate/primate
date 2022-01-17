/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

function _httpInterceptor($q) {
    return {
        response(result) {
            result.configText = `${result.status} ${result.statusText} - ${result.config.method} ${result.config.url}`;
            return result;
        },

        responseError(error) {
            error.configText = `${error.status} ${error.statusText} - ${error.config.method} ${error.config.url}`;
            return $q.reject(error);
        }
    };
}

export default function HttpInterceptor(httpProvider) {
    httpProvider.interceptors.push(_httpInterceptor);
}
