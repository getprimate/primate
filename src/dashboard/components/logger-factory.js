/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

/**
 * @typedef {Object} LoggerFactory - Factory service to log activity
 *
 * @property {function} _write - Private function to handle writes
 * @property {function} getCache - Returns the cache array
 * @property {function} write - Writes into logger cache
 * @property {function} clear - Clears logger cache
 * @property {function} error - Formats error message and writes into logger cache
 * @property {function} info - Formats info message and writes into logger cache
 * @property {function} warn - Formats warn message and writes into logger cache
 * @property {function} pause - Temporarily suspends write operations
 * @property {function} resume - Resumes write operations
 * @property {function} isPaused - Tells whether the write operations are paused or not
 */

import _ from '../lib/utils.js';

/**
 * Holds the current state of the logger.
 *
 * @type {{isPaused: boolean, maxLength: number}}
 */
const LOG_STATE = {maxLength: 100, isPaused: false};

/**
 * Holds the messages queued for logging.
 *
 * The maximum length of the log cache is determined by maxLength field in {@link LOG_STATE}.
 *
 * @type {{highlight: string, level: string, message: string, timestamp: string}[]}
 */
const LOG_CACHE = [];

/**
 * Provides a sugar function to format HTTP responses as log messages.
 *
 * @private
 *
 * @param {{exception: {fields: Object|null, message: string},
 *      source: String}} response - The response object from an HTTP request
 * @return {string} The formatted string for logging
 */
const _fromHttpResponse = (response) => {
    const {httpConfig = {method: 'Unknown', url: 'unknown'}, statusText = 'Unknown', statusCode = 'Unknown'} = response;

    let message = `${statusCode} ${statusText} - ${httpConfig.method} ${httpConfig.url}`;

    if (typeof response.exception !== 'object' || response.exception === null) {
        return message;
    }

    let {exception} = response;

    if (response.source === 'admin-error') {
        message = typeof exception.message === 'string' ? `${message} - ${exception.message}` : message;
        message =
            typeof exception.fields === 'object' && exception.fields !== null
                ? `${message} - ` + JSON.stringify(exception.fields)
                : message;
    }

    return message;
};

/**
 * Sanitises log messages to a particular format before pushing into [Log Cache]{@link LOG_CACHE}.
 *
 * @private
 *
 * @param {string} level - The log levels (INFO, WARN, ERROR)
 * @param {string|null|{source: string, exception: Object}} message - the message to be logged
 * @return {{level: string, message: string, timestamp: string}} - The formatted string
 */
const _sanitise = (level, message) => {
    const date = new Date();
    const timestamp = date.toJSON().substr(0, 19).replace('T', ' ');

    let text = typeof message === 'string' ? message : '';

    if (typeof message === 'object') {
        switch (message.source) {
            case 'http-request':
            case 'http-response':
            case 'http-error':
            case 'admin-error':
                text = _fromHttpResponse(message);
                break;

            default:
                text = JSON.stringify(message);
        }
    }

    return {message: text, level: level.trim().toLowerCase(), timestamp};
};

/**
 * Sanitises a message and writes to [log cache]{@link LOG_CACHE}.
 *
 * @private
 *
 * @param {string} level - Either of INFO, WARN or ERROR.
 * @param {string|null|{source: string, exception: Object}} message - The message to be logged
 * @return {number} - The log cache length
 */
const _write = (level, message) => {
    if (LOG_STATE.isPaused === true) {
        return LOG_CACHE.length;
    }

    if (LOG_CACHE.length === LOG_STATE.maxLength) {
        LOG_CACHE.splice(0);
    }

    return LOG_CACHE.push(_sanitise(level, message));
};

/**
 * Returns the [logger factory]{@link LoggerFactory} singleton.
 *
 * @constructor
 *
 * @return {{resume(): void, warn(*): *, isPaused(): boolean, getCache(): Object[],
 *      clear(): Object[], error(*): *, pause(): void, info(*): *}} - The logger factory singleton
 */
export default function LoggerFactory() {
    return {
        getCache() {
            return LOG_CACHE;
        },

        info(message) {
            return _write('INFO', message);
        },

        warn(message) {
            return _write('WARN', message);
        },

        error(message) {
            return _write('ERROR', message);
        },

        exception(message, error) {
            if (_.isObject(error)) {
                message = typeof error.message === 'string' ? `${message} - ${error.message}` : message;

                if (_.isObject(error.fields)) {
                    message = `${message} - ` + JSON.stringify(error.fields);
                }
            }

            return _write('ERROR', message);
        },

        clear() {
            return LOG_CACHE.splice(0);
        },

        pause() {
            LOG_STATE.isPaused = true;
        },

        resume() {
            LOG_STATE.isPaused = false;
        },

        isPaused() {
            return LOG_STATE.isPaused;
        }
    };
}
