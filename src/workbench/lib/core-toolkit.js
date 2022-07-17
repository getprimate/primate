'use strict';

/**
 * @template T
 * @param {T} source
 * @return {T}
 * @private
 */
function _baseClone(source) {
    const {angular} = window;

    return angular.copy(source);
}

export function isDefined(value) {
    return !(value === undefined);
}

export function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isNil(value) {
    return typeof value === 'undefined' || value === null;
}

export function isNone(value) {
    switch (typeof value) {
        case 'object':
            return value === null;

        case 'undefined':
            return true;

        case 'string':
            return value.length === 0 || value === '__none__';

        default:
            return false;
    }
}

export function isText(value) {
    return typeof value === 'string';
}

export function isEmpty(value) {
    switch (typeof value) {
        case 'object':
            return value === null || (Array.isArray(value) && value.length === 0) || Object.keys(value).length === 0;

        case 'string':
            return value.length === 0;

        case 'number':
            return value === 0;

        case 'function':
            return false;

        case 'boolean':
            return value === false;

        case 'undefined':
        default:
            return false;
    }
}

/**
 * Clones the provided value recursively.
 *
 * @template T
 * @param {T} value - The object to be cloned.
 * @returns {T} The cloned object
 */
export function deepClone(value) {
    return _baseClone(value);
}

export function get(object, path, defaultValue = null) {
    if (object === null) {
        return defaultValue;
    }

    return typeof object[path] === 'undefined' ? defaultValue : object[path];
}

export function explode(input = '', separator = ',') {
    const items = input.split(separator);
    return items.reduce((exploded, current) => {
        current = current.trim();

        if (current.length > 0) {
            exploded.push(current);
        }

        return exploded;
    }, []);
}

/**
 * Converts dashed string to camel case.
 *
 * For example, the text dash-to-camel becomes dashToCamel.
 *
 * @param {string} value - The input string to be converted
 * @returns {string}. The converted text.
 */
export function dashToCamel(value) {
    return value.replace(/-([a-z])/g, (hyphen, char) => {
        return char.toUpperCase();
    });
}

export function snakeToDisplayText(value) {
    if (typeof value !== 'string') {
        return '';
    }

    let displayText = '';
    let nextIsUpper = true;

    for (let index = 0; index < value.length; index++) {
        let char = value.charAt(index);

        if (char === '_') {
            displayText = displayText + ' ';
            nextIsUpper = true;
            continue;
        }

        displayText = displayText + (nextIsUpper ? char.toUpperCase() : char);
        nextIsUpper = false;
    }

    return displayText.trim();
}

/**
 * Wraps array join function.
 *
 * @param {string[]} keywords - An array of strings.
 * @param {number} maxLen - Length beyond which string should be trimmed.
 * @return {string} Imploded string.
 */
export function implode(keywords, maxLen = 50) {
    if (isEmpty(keywords) || !Array.isArray(keywords)) return '';

    const text = keywords.join(', ');

    if (text.length <= maxLen) return text;

    return text.substring(0, maxLen - 1) + '...';
}

/**
 * Returns the first element in an array.
 *
 * @param {Array} values - An array of values
 * @return {any} The first element in the array.
 */
export function first(values) {
    return Array.isArray(values) && values.length >= 1 ? values[0] : null;
}

/**
 * Returns the last element in an array.
 *
 * @param {Array} values - An array of values
 * @return {any} The first element in the array.
 */
export function last(values) {
    const length = Array.isArray(values) ? values.length : 0;
    return length === 0 ? null : values[length - 1];
}

/**
 *
 * @param {string} text
 * @param {any} fallback
 */
export function trim(text, fallback = null) {
    return typeof text === 'string' ? text.trim() : fallback;
}

export function randomHex(length = 16) {
    const multiplier = ((Date.now() + 100 * Math.random()) / 1000) * Math.random();
    let randomText = '';
    let textLength = 0;

    while (textLength <= length) {
        let suffix = Math.floor(Math.random() * multiplier).toString(16);

        randomText = `${randomText}${suffix}`;
        textLength = textLength + suffix.length;
    }

    return randomText.substring(0, length);
}

export function parseNumeric(value, defaultValue = -1) {
    const parsed = parseInt(value);

    return isNaN(parsed) ? defaultValue : parsed;
}
