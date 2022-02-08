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
            return value === '__none__';

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

export function objectName(input) {
    if (typeof input !== 'string' || input.length === 0) {
        return 'None';
    }

    let position = input.length;

    while (position >= 0) {
        if (input.charAt(position) === '-') {
            break;
        }

        position--;
    }

    if (position === 0 || position === input.length) {
        return input;
    }

    return input.substr(position + 1).toUpperCase();
}

export function typeCast(input = '') {
    switch (input) {
        case 'true':
            return true;

        case 'false':
            return false;

        case 'null':
            return null;

        default:
            break;
    }

    const numeric = parseInt(input);
    return isNaN(numeric) ? input : numeric;
}

export function editPath(current, id = '') {
    let replaced = current.replace('/__create__', `/${id}`);

    if (replaced.charAt(0) !== '/') {
        replaced = `/${replaced}`;
    }

    return `#!${replaced}`;
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
