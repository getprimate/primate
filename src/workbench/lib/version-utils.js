/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import {explode} from './core-toolkit.js';

export function greaterThan(vLeft, vRight) {
    if (vLeft === vRight) return false;

    const lParts = explode(vLeft, '.').map((part) => {
        return parseInt(part);
    });

    const rParts = explode(vRight, '.').map((part) => {
        return parseInt(part);
    });

    for (let index in lParts) {
        if (lParts[index] === rParts[index]) {
            continue;
        }

        if (lParts[index] > rParts[index]) {
            return true;
        }

        return false;
    }
}

/**
 * Returns the generic semantic version form.
 *
 * For example:
 * - Input: 2.7.0
 *   Output: 2.7.z (places = 1)
 * - Input: 2.7.0
 *   Output: 2.y.z (places = 2)
 *
 * @param {string} version - The version string.
 * @param {number} places - The place value.
 * @return {string} The semantic version form.
 */
export function genericForm(version, places = 1) {
    const parts = version.split('.').reduce((list, value, index) => {
        const part = parseInt(value);

        if (false === isNaN(part) && index <= 2) {
            list.push(part);
        }

        return list;
    }, []);
    const chars = ['x', 'y', 'z'];

    for (let index = parts.length - 1; index >= 0; index--) {
        if (places > 0) {
            parts[index] = chars[index];
        }

        places--;
    }

    return parts.join('.');
}
