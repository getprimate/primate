/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

/**
 * Formats UNIX-timestamp to human-readable date text.
 *
 * @param {number} seconds - Unix timestamp in seconds.
 * @param {('date'|'utc')} format - Format specifier.
 * @return {string}
 */
export function epochToDate(seconds, format = 'date') {
    const date = new Date(seconds * 1000);

    switch (format) {
        case 'date':
            return date.toDateString();

        case 'utc':
            return date.toUTCString();

        default:
            return date.toString();
    }
}

/**
 * @deprecated Use epochToDate instead.
 * @param seconds
 * @param format
 * @return {string}
 */
export function toDateText(seconds, format = 'date') {
    return epochToDate(seconds, format);
}
