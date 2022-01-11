/**
 * @typedef {Object} LoggerFactory
 * @type {Object}
 * @property {function} getCache - returns the cache array
 * @property {function} write - writes into logger cache
 * @property {function} clear - clears logger cache
 * @property {function} error - formats error message and writes into logger cache
 * @property {function} info - formats info message and writes into logger cache
 * @property {function} warn - formats warn message and writes into logger cache
 */

'use strict';

const LOG_CACHE = [];

const _fromHttpResponse = (response) => {
    const {httpConfig = {method: 'Unknown', 'url': 'unknown'}, statusText = 'Unknown', statusCode = 'Unknown'} = response;

    let message = `${statusCode} ${statusText} - ${httpConfig.method} ${httpConfig.url}`;

    if (typeof response.exception !== 'object' || response.exception === null) {
        return message;
    }

    let {exception} = response;

    if (response.source === 'admin-error') {
        message = (typeof exception.message === 'string') ? `${message} - ${exception.message}` : message;
        message = ((typeof exception.fields === 'object') && (exception.fields !== null)) ? (`${message} - ` + JSON.stringify(exception.fields)) : message;
    }

    return message;
};

const _sanitise = (type, message)=> {
    let text = (typeof message === 'string') ? message : '';

    if (typeof message === 'object' && message !== null) {
        switch (message.source) {
            case 'http-request':
            case 'http-response':
            case 'http-error':
            case 'admin-error':
                text =_fromHttpResponse(message);
                break;

            default:
                text = JSON.stringify(message);
        }
    }

    const date = new Date();

    const timestamp = date.toJSON().substr(0, 19).replace('T', ' ');

    return {
        message: text,
        highlight: type,
        className: type.trim().toLowerCase(),
        timestamp
    };
};

export default function LoggerFactory() {

    return {
        _write(type, message) {
            if (LOG_CACHE.length === 100) {
                LOG_CACHE.splice(0);
            }

            return LOG_CACHE.push(_sanitise(type, message));
        },

        getCache() {
            return LOG_CACHE;
        },

        info(message) {
            return this._write('INFO', message);
        },

        warn(message) {
            return this._write('WARN', message);
        },

        error(message) {
            return this._write('ERROR', message);
        },

        clear() {
            return LOG_CACHE.splice(0);
        }
    };
}
