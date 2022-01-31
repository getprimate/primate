'use strict';

/**
 * A callback to be executed on completion.
 *
 * @callback GenericHandlerCallback
 * @param {error: string|null} err - The error message if present.
 * @param {{target: string}=} properties - The property payload from the function.
 */

import _ from '../../lib/core-utils.js';

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

    event.preventDefault();

    if (element.nodeName === 'SPAN' && classList.contains('critical') && classList.contains('delete')) {
        const {target, endpoint} = element.dataset;
        if (!_.isText(endpoint)) return false;

        const proceed = confirm(`Delete this ${target}?`);
        if (proceed === false) return proceed;

        const request = this._client.delete(endpoint);

        request.then(() => {
            element.closest('tr').remove();
            if (typeof this._callback === 'function') this._callback.call(null, {target});
        });

        request.catch(() => {
            if (typeof this._callback === 'function') this._callback.call(`Unable to delete ${target}.`, {target});
        });
    }

    return true;
}

/**
 * Binds {@link deleteMethodHandler} with the provided parameters.
 *
 * @param {RESTClientFactory} restClient - Customised HTTP REST client factory.
 * @param {GenericHandlerCallback} callback - A callback to be executed on completion.
 */
export function deleteMethodInitiator(restClient, callback) {
    return deleteMethodHandler.bind({_client: restClient, _callback: callback});
}
