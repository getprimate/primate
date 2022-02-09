/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import * as _ from '../../lib/core-toolkit.js';
import {urlOffset, urlQuery} from '../../lib/rest-utils.js';
import {deleteMethodInitiator} from '../helpers/rest-toolkit.js';

import ConsumerModel from '../models/consumer-model.js';
import UserAuthModel from '../models/user-auth-model.js';

/**
 * Provides controller constructor for editing consumer objects.
 *
 * @constructor
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
export default function ConsumerEditController(scope, location, routeParams, restClient, viewFrame, toast) {
    const ajaxConfig = {method: 'POST', endpoint: '/consumers'};
    const eventLocks = {submitConsumerForm: false, submitAuthForm: false};

    let loaderSteps = 1;

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
    scope.pluginNext = {offset: ''};

    /**
     * Submits the consumer form data.
     *
     * @param {Event} event - The current event object.
     * @returns {boolean} True if request could be made, false otherwise.
     */
    scope.submitConsumerForm = function (event) {
        if (eventLocks.submitConsumerForm === true) return false;
        else eventLocks.submitConsumerForm = true;

        event.preventDefault();
        viewFrame.setLoaderSteps(2);

        const payload = _.deepClone(scope.consumerModel);
        const request = restClient.request({method: ajaxConfig.method, endpoint: ajaxConfig.endpoint, payload});

        viewFrame.incrementLoader();
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

        request.finally(() => {
            eventLocks.submitConsumerForm = false;
            viewFrame.incrementLoader();
        });

        return false;
    };

    /**
     * Resets consumer details form if the user confirms the prompt.
     *
     * @param {Event} event - The current event object.
     * @returns {boolean} True if form has been reset, false otherwise.
     */
    scope.resetConsumerForm = function (event) {
        if (eventLocks.submitConsumerForm === true) return false;

        if (confirm('Proceed to clear the form?')) {
            eventLocks.submitConsumerForm = false;

            scope.consumerModel = _.deepClone(ConsumerModel);

            eventLocks.submitConsumerForm = true;

            return true;
        }

        event.preventDefault();
        return false;
    };

    /**
     * Submits the user authentication method form.
     *
     * @param {Event} event - The current event object.
     * @returns {boolean} True if request could be made, false otherwise.
     */
    scope.submitAuthForm = function (event) {
        if (eventLocks.submitAuthForm === true) return false;
        else eventLocks.submitAuthForm = true;

        event.preventDefault();
        viewFrame.setLoaderSteps(2);

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

        viewFrame.incrementLoader();
        request.then(({data: response}) => {
            scope.userAuthList[authName].push(response);

            /* Clear the form */
            scope.userAuthModel[authName] = _.deepClone(UserAuthModel[authName]);

            toast.success('Authentication method saved.');
        });

        request.catch(() => {
            toast.error('Could not save authentication method.');
        });

        request.finally(() => {
            eventLocks.submitConsumerForm = false;
            viewFrame.incrementLoader();
        });

        return false;
    };

    /**
     * Retrieves the list of added authentication methods.
     *
     * @param {string} method - The authentication method name.
     * @returns {boolean} True if request could be made, false otherwise.
     */
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

    /**
     * Retrieves the list of plugins applied on this consumer.
     */
    scope.fetchPluginList = function (filters = null) {
        const request = restClient.get(`/consumers/${scope.consumerId}/plugins` + urlQuery(filters));

        viewFrame.setLoaderSteps(1);

        request.then(({data: response}) => {
            scope.pluginNext.offset = urlOffset(response.next);

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

        request.finally(() => {
            viewFrame.incrementLoader();
        });
    };

    /**
     * Switches between authentication forms.
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

    /**
     * Deletes the table row entry upon clicking the bin icon.
     *
     * @type {function(Event): boolean}
     */
    scope.deleteTableRow = deleteMethodInitiator(restClient, (err, properties) => {
        if (_.isText(err)) toast.error(err);
        else toast.success(`Deleted ${properties.target}.`);
    });

    viewFrame.clearBreadcrumbs();
    viewFrame.addBreadcrumb('#!/consumers', 'Consumers');

    switch (routeParams.consumerId) {
        case '__create__':
            viewFrame.setTitle('Add New Consumer');
            viewFrame.addBreadcrumb(location.path(), 'Create +');
            break;

        default:
            ajaxConfig.method = 'PATCH';
            ajaxConfig.endpoint = `${ajaxConfig.endpoint}/${routeParams.consumerId}`;
            scope.consumerId = routeParams.consumerId;
            viewFrame.setTitle('Edit Consumer');

            loaderSteps = loaderSteps + 2;

            break;
    }

    viewFrame.setLoaderSteps(loaderSteps);
    viewFrame.incrementLoader();

    if (ajaxConfig.method === 'PATCH' && scope.consumerId !== '__none__') {
        const request = restClient.get(`/consumers/${scope.consumerId}`);

        request.then(({data: response}) => {
            const {username, custom_id: customId} = response;

            for (let field in response) {
                if (typeof scope.consumerModel[field] === 'undefined' || response[field] === null) {
                    continue;
                }

                scope.consumerModel[field] = response[field];
            }

            viewFrame.addAction(
                'Delete',
                '#!/consumers',
                'critical delete',
                'consumer',
                `/consumers/${scope.consumerId}`
            );

            viewFrame.addBreadcrumb(location.path(), _.isText(username) ? username : customId);
        });

        request.catch(() => {
            toast.error('Unable to fetch consumer details.');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });

        scope.fetchAuthList('key-auth');
        scope.fetchPluginList(`/consumers/${scope.consumerId}/plugins`);
    }
}
