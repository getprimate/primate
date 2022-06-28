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
