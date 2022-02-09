/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import * as _ from '../../lib/core-toolkit.js';
import {urlQuery, urlOffset} from '../../lib/rest-utils.js';

/**
 * Provides controller constructor for editing plugin objects.
 * @constructor
 * @param {Object} scope - Injected scope object.
 * @param {RESTClientFactory} restClient - Customised HTTP REST client factory.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 * @param {ToastFactory} toast - Factory for displaying notifications.
 */
export default function PluginListController(scope, restClient, viewFrame, toast) {
    scope.pluginList = [];
    scope.pluginNext = {offset: ''};

    /**
     * Retrieves the list of plugins enabled for various objects.
     *
     * @param {string|object|null} filters - Filters to the Admin API.
     * @return {boolean} True if request could be made, false otherwise.
     */
    scope.fetchPluginList = function (filters = null) {
        const request = restClient.get('/plugins' + urlQuery(filters));

        viewFrame.setLoaderSteps(1);

        request.then(({data: response}) => {
            scope.pluginNext.offset = urlOffset(response.next);

            for (let plugin of response.data) {
                let objectNames = [];

                if (_.isObject(plugin.service)) objectNames.push('Service');
                if (_.isObject(plugin.route)) objectNames.push('Route');
                if (_.isObject(plugin.consumer)) objectNames.push('Consumer');

                scope.pluginList.push({
                    id: plugin.id,
                    enabled: plugin.enabled,
                    name: plugin.name,
                    protocols: Array.isArray(plugin.protocols) ? plugin.protocols.join(', ') : 'None',
                    created_at: plugin.created_at,
                    objectNames: objectNames.length === 0 ? 'None' : objectNames.join(', ')
                });
            }
        });

        request.catch(() => {
            toast.error('Could not load list of plugins');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });
    };

    /**
     * Toggles plugin state to enabled or disabled.
     *
     * The event listener is attached to plugin list table.
     *
     * @param {HTMLInputElement} target - The target checkbox element.
     * @returns {boolean} True if action completed, false otherwise.
     */
    scope.togglePluginState = function ({target}) {
        if (target.nodeName !== 'INPUT' || target.type !== 'checkbox') {
            return false;
        }

        const endpoint = `/plugins/${target.value}`;
        const request = restClient.patch(endpoint, {enabled: target.checked});

        request.then(() => {
            toast.success('Plugin ' + (target.checked ? 'enabled.' : 'disabled.'));
        });

        request.catch(() => {
            toast.error('Unable to change plugin state.');
        });

        return true;
    };

    viewFrame.setTitle('Plugins');

    viewFrame.clearBreadcrumbs();
    viewFrame.addBreadcrumb('!#/plugins', 'Plugins');

    viewFrame.addAction('Apply Plugin', '#!/plugins/__create__');

    scope.fetchPluginList();
}
