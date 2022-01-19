'use strict';

function _baseClone(source) {
    const {angular} = window;

    return angular.copy(source);
}

function _isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function _isNil(value) {
    return typeof value === 'undefined' || value === null;
}

export default {
    deepClone: _baseClone,
    isObject: _isObject,
    isNil: _isNil,

    get(object, path, defaultValue = null) {
        if (object === null) {
            return defaultValue;
        }

        return typeof object[path] === 'undefined' ? defaultValue : object[path];
    },

    explode(input = '', separator = ',') {
        const items = input.split(separator);
        return items.reduce((exploded, current) => {
            current = current.trim();

            if (current.length > 0) {
                exploded.push(current);
            }

            return exploded;
        }, []);
    },

    objectName(input) {
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
    },

    typeCast(input = '') {
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
};
