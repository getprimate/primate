/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

export function toDateText(seconds, format = 'date') {
    const date = new Date(seconds * 1000);

    switch (format) {
        case 'date':
            return date.toDateString();

        case 'UTC':
        case 'GMT':
            return date.toUTCString();

        default:
            return date.toString();
    }
}

export function epochToDate(seconds, format = 'date') {
    /** TODO : Make this the primary export. Remove toDateText() and its usages. */
    return toDateText(seconds, format);
}
