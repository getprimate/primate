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
 * @callback RESTHandlerCallback
 * @param {error: string|null} err - The error message if present.
 * @param {{target?: string, attribute?: string}=} properties - The property payload from the function.
 */

import {isText, isObject, isEmpty} from '../lib/core-toolkit.js';
import * as _ from '../lib/core-toolkit';

/**
 * Handles delete requests initiated from delete icons.
 *
 * @param {Event} event - The current event object.
 * @property {RESTClientFactory} _client - Customised HTTP REST client factory.
 * @property {RESTHandlerCallback} _callback - A callback to be executed on completion.
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
            if (typeof this._callback === 'function') this._callback.call(null, null, {target});
        });

        request.catch(() => {
            if (typeof this._callback === 'function')
                this._callback.call(null, `Unable to delete ${target}.`, {target});
        });
    }

    return true;
}

/**
 * Handles patch requests initiated from input boxes or icons.
 *
 * @param {Event} event - The click event object.
 * @property {RESTClientFactory} _client - Customised HTTP REST client factory.
 * @property {RESTHandlerCallback} _callback - A callback to be executed on completion.
 */
function patchMethodHandler(event) {
    if (typeof this._client === 'undefined') return false;

    const {target: element} = event;

    if (element.nodeName === 'INPUT' && element.type === 'checkbox') {
        const {target = 'Entity', endpoint, attribute} = element.dataset;

        if (!isText(endpoint) || !isText(attribute)) {
            return false;
        }

        const request = this._client.patch(endpoint, {[attribute]: element.checked});

        request.then(() => {
            if (typeof this._callback === 'function') {
                this._callback.call(null, null, element.dataset);
            }
        });

        request.catch(() => {
            if (typeof this._callback === 'function') {
                this._callback.call(null, `Unable to update ${target}.`, element.dataset);
            }
        });
    }

    return true;
}

/**
 * Binds {@link deleteMethodHandler} with the provided parameters.
 *
 * @param {RESTClientFactory} restClient - Customised HTTP REST client factory.
 * @param {RESTHandlerCallback} callback - A callback to be executed on completion.
 * @return {(function(Event): boolean)} The event handler function.
 */
export function deleteMethodInitiator(restClient, callback) {
    return deleteMethodHandler.bind({_client: restClient, _callback: callback});
}

/**
 * Binds {@link patchMethodHandler} with the provided parameters.
 *
 * @param {RESTClientFactory} restClient - Customised HTTP REST client factory.
 * @param {RESTHandlerCallback} callback - A callback to be executed on completion.
 * @return {(function(Event): boolean)} The event handler function.
 */
export function patchMethodInitiator(restClient, callback) {
    return patchMethodHandler.bind({_client: restClient, _callback: callback});
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

/**
 * @deprecated Use implode in core-toolkit instead.
 * @param keywords
 * @param maxLen
 * @return {string|*}
 */
export function implode(keywords, maxLen = 50) {
    if (isEmpty(keywords) || !Array.isArray(keywords)) return '';

    const text = keywords.join(', ');

    if (text.length <= maxLen) return text;

    return text.substring(0, maxLen - 1) + '...';
}

export function editViewURL(current, id = '') {
    let replaced = current.replace('/__create__', `/${id}`);

    if (replaced.charAt(0) !== '/') {
        replaced = `/${replaced}`;
    }

    return replaced;
}

/**
 * Sanitises header name - value map from token list.
 *
 * @param {Record<string, string>} header - The header key and value as string.
 * @return {Record<string, [string]>} The header key and values as array.
 */
export function explodeHeaderMap(header) {
    const headerMap = {};

    for (let key of Object.keys(header)) {
        let value = header[key];

        key = key.trim().replace(/[^-_a-zA-Z0-9]/g, '-');

        if (key.length === 0) {
            continue;
        }

        headerMap[key] = _.explode(value, ',');
    }

    return headerMap;
}

/**
 * Creates header tokens from name-value map.
 *
 * This function does the reverse of {@link explodeHeaderMap}.
 *
 * @param {Record<string, string[]>} headers - The header key-value pair.
 * @return {Record<string, string>} The record map.
 */
export function implodeHeaderMap(headers) {
    const nameList = Object.keys(headers);

    for (let name of nameList) {
        headers[name] = _.implode(headers[name]);
    }

    return headers;
}
