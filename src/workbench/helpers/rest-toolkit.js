/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

/**
 * A callback to be executed on completion.
 *
 * @callback GenericHandlerCallback
 * @param {error: string|null} err - The error message if present.
 * @param {{target: string}=} properties - The property payload from the function.
 */

import {isText, isObject, isEmpty} from '../../lib/core-toolkit.js';

/**
 * Handles delete requests initiated from delete icons.
 *
 * @param {Event} event - The current event object.
 * @property {RESTClientFactory} _client - Customised HTTP REST client factory.
 * @property {GenericHandlerCallback} _callback - A callback to be executed on completion.
 */
function deleteMethodHandler(event) {
    if (typeof this._client === 'undefined') return false;

    const {target: element} = event;
    const {classList} = element;

    if (element.nodeName === 'SPAN' && classList.contains('critical') && classList.contains('delete')) {
        event.preventDefault();

        const {target, endpoint} = element.dataset;
        if (!isText(endpoint)) return false;

        const proceed = confirm(`Delete this ${target}?`);
        if (proceed === false) return proceed;

        const request = this._client.delete(endpoint);

        request.then(() => {
            element.closest('tr').remove();
            if (typeof this._callback === 'function') this._callback.call(null, {target});
        });

        request.catch(() => {
            if (typeof this._callback === 'function')
                this._callback.call(null, `Unable to delete ${target}.`, {target});
        });
    }

    return true;
}

/**
 * Binds {@link deleteMethodHandler} with the provided parameters.
 *
 * @param {RESTClientFactory} restClient - Customised HTTP REST client factory.
 * @param {GenericHandlerCallback} callback - A callback to be executed on completion.
 * @return {(function(Event): boolean)} The event handler function.
 */
export function deleteMethodInitiator(restClient, callback) {
    return deleteMethodHandler.bind({_client: restClient, _callback: callback});
}

export function simplifyObjectId(objectId) {
    if (typeof objectId !== 'string' || objectId.length === 0) {
        return 'None';
    }

    let position = objectId.length;

    while (position >= 0) {
        if (objectId.charAt(position) === '-') {
            break;
        }

        position--;
    }

    if (position === 0 || position === objectId.length) {
        return objectId;
    }

    return objectId.substr(position + 1).toUpperCase();
}

export function epochToDate(seconds, format = 'date') {
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

export function urlOffset(location) {
    if (!isText(location)) return '';

    const url = new URL(location);
    const params = url.searchParams;

    return params.has('offset') ? params.get('offset') : '';
}

export function urlQuery(options) {
    if (isObject(options)) {
        const params = new URLSearchParams();

        for (let name in options) {
            params.append(name, options[name]);
        }

        return '?' + params.toString();
    }

    if (isText(options)) {
        return `?${options}`;
    }

    return '';
}

export function tagsToText(tags, maxLen = 50) {
    if (isEmpty(tags) || !Array.isArray(tags)) return '';

    const text = tags.join(', ');

    if (text.length <= maxLen) return text;

    return text.substring(0, maxLen - 1) + '...';
}
