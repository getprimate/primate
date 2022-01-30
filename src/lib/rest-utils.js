/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import _ from './core-utils.js';

export function urlOffset(location) {
    if (!_.isText(location)) return '';

    const url = new URL(location);
    const params = url.searchParams;

    return params.has('offset') ? params.get('offset') : '';
}

export function urlQuery(options) {
    if (_.isObject(options)) {
        const params = new URLSearchParams();

        for (let name in options) {
            params.append(name, options[name]);
        }

        return '?' + params.toString();
    }

    if (_.isText(options)) {
        return `?${options}`;
    }

    return '';
}
