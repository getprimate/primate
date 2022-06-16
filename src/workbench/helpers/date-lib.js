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
 * @param {('en-IN'|'en-US'|'standard')} format - Format specifier.
 * @return {string}
 */
export function epochToDate(seconds, format = 'date') {
    const date = new Date(seconds * 1000);

    switch (format) {
        case 'en-IN':
            return date.toLocaleDateString('en-IN');

        case 'en-US':
            return date.toLocaleDateString('en-US');

        default:
            return date.toDateString();
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
