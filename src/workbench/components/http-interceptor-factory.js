/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const IGNORED_PATH = 'static/views';

export default function HttpInterceptorFactory($q, logger) {
    return {
        response(result) {
            result.httpText = `${result.status} ${result.statusText} - ${result.config.method} ${result.config.url}`;

            if (result.config.url.substr(0, 12) !== IGNORED_PATH) {
                logger.info(result.httpText);
            }

            return result;
        },

        responseError(error) {
            error.httpText = `${error.status} ${error.statusText} - ${error.config.method} ${error.config.url}`;

            if (error.config.url.substr(0, 12) !== IGNORED_PATH) {
                logger.exception(error.httpText, error.data);
            }

            return $q.reject(error);
        }
    };
}
