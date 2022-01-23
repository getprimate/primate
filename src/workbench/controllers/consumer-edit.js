/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import _ from '../../lib/core-utils.js';

import ConsumerModel from '../models/consumer-model.js';
import UserAuthModel from '../models/user-auth-model.js';

/**
 * Provides controller constructor for editing consumer objects.
 *
 * @constructor
 *
 * @param {Window} window- The top level Window object.
 * @param {Object} scope - The injected scope object.
 * @param {Object} location - Injected location service.
 * @param {function} location.path - Tells the current view path.
 * @param {{
 *     pluginId: string,
 *     consumerId: string
 * }} routeParams - Injected route parameters service.
 * @param {RESTClientFactory} restClient - Custom AJAX provider.
 * @param {ViewFrameFactory} viewFrame - Custom view frame factory.
 * @param {ToastFactory} toast - Custom toast message service.
 */
export default function ConsumerEditController(window, scope, location, routeParams, restClient, viewFrame, toast) {
    const ajaxConfig = {method: 'POST', endpoint: '/consumers'};

    scope.ENUM_JWT_ALGO = ['HS256', 'HS384', 'HS512', 'RS256', 'ES256'];

    scope.consumerId = '__none__';
    scope.consumerModel = _.deepClone(ConsumerModel);
    scope.userAuthModel = _.deepClone(UserAuthModel);

    scope.userAuthList = {
        keyAuth: [],
        basicAuth: [],
        oauth2: [],
        hmacAuth: [],
        jwt: [],
        acls: []
    };

    scope.pluginList = [];

    if (typeof routeParams.pluginId === 'string') {
        viewFrame.addRoute(`#!/plugins/${routeParams.pluginId}`);
    }

    switch (routeParams.consumerId) {
        case '__create__':
            viewFrame.setTitle('Add New Consumer');
            viewFrame.addRoute('#!/consumers');
            break;

        default:
            ajaxConfig.method = 'PATCH';
            ajaxConfig.endpoint = `${ajaxConfig.endpoint}/${routeParams.consumerId}`;

            scope.consumerId = routeParams.consumerId;

            viewFrame.setTitle('Edit Consumer');
            break;
    }

    scope.submitConsumerForm = function (event) {
        const payload = _.deepClone(scope.consumerModel);
        const request = restClient.request({method: ajaxConfig.method, endpoint: ajaxConfig.endpoint, payload});

        event.preventDefault();

        request.then(({data: response}) => {
            const level = scope.consumerId === '__none__' ? 'SUCCESS' : 'INFO';

            toast.message(level, 'Consumer details saved.');

            if (level === 'SUCCESS') {
                window.location.href = _.editPath(location.path(), response.id);
            }
        });

        request.catch(() => {
            toast.error('Could not save consumer details.');
        });

        return false;
    };

    scope.resetConsumerForm = function (event) {
        if (confirm('Proceed to clear the form?')) {
            scope.consumerModel = _.deepClone(ConsumerModel);
            return true;
        }

        event.preventDefault();
        return false;
    };

    scope.submitAuthForm = function (event) {
        const {target} = event;
        const {authMethod} = target.dataset;

        const authName = _.dashToCamel(authMethod);
        const authWrap = scope.userAuthModel[authName];

        const payload = _.deepClone(authWrap);

        for (let field in authWrap) {
            if (typeof authWrap[field] === 'string' && authWrap[field].length === 0) {
                delete payload[field];
            }
        }

        const request = restClient.post(`/consumers/${scope.consumerId}/${authMethod}`, payload);

        event.preventDefault();

        request.then(({data: response}) => {
            scope.userAuthList[authName].push(response);

            /* Clear the form */
            scope.userAuthModel[authName] = _.deepClone(UserAuthModel[authName]);

            toast.success('Authentication method saved.');
        });

        request.catch(() => {
            toast.error('Could not save authentication method.');
        });

        return false;
    };

    scope.fetchAuthList = function (method) {
        const authName = _.dashToCamel(method);

        if (typeof scope.userAuthList[authName] === 'undefined') {
            return false;
        }

        const request = restClient.get(`/consumers/${scope.consumerId}/${method}`);

        request.then(({data: response}) => {
            scope.userAuthList[authName] = response.data;
        });

        request.catch(() => {
            toast.error('Could not load authentication details');
        });

        return true;
    };

    scope.fetchPluginList = function () {
        const request = restClient.get(`/consumers/${scope.consumerId}/plugins`);

        request.then(({data: response}) => {
            for (let plugin of response.data) {
                scope.pluginList.push({
                    id: plugin.id,
                    name: plugin.name,
                    enabled: plugin.enabled
                });
            }
        });

        request.catch(() => {
            toast.warning('Could not fetch consumer plugins.');
        });
    };

    /**
     *
     * @param {EventTarget} event - Current event object.
     */
    scope.switchAuthTab = function (event) {
        const {target, currentTarget: tabList} = event;

        if (target.nodeName !== 'LI' || _.isNil(target.dataset.pageId) || _.isNil(target.dataset.authMethod)) {
            return false;
        }

        const {parentNode: notebook, children: pages} = tabList;
        const {pageId, authMethod} = target.dataset;

        scope.fetchAuthList(authMethod);

        for (let page of pages) {
            page.classList.remove('active');
        }

        target.classList.add('active');

        for (let section of notebook.querySelectorAll('section.notebook__page')) {
            section.classList.remove('active');
        }

        notebook.querySelector(pageId).classList.add('active');
        return true;
    };

    if (ajaxConfig.method === 'PATCH' && scope.consumerId !== '__none__') {
        const request = restClient.get(`/consumers/${scope.consumerId}`);

        request.then(({data: response}) => {
            for (let field in response) {
                if (typeof scope.consumerModel[field] === 'undefined' || response[field] === null) {
                    continue;
                }

                scope.consumerModel[field] = response[field];
            }

            viewFrame.addAction('Delete', '#!/consumers', 'critical delete', 'consumer', `/ca_certificates/${scope.consumerId}`);
        });

        request.catch(() => {
            toast.error('Could not load consumer details');
            window.location.href = viewFrame.getNextRoute(false);
        });

        scope.fetchAuthList('key-auth');
        scope.fetchPluginList(`/consumers/${scope.consumerId}/plugins`);
    }
}
