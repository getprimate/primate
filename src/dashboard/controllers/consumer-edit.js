/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

/**
 * @typedef {import('../components/view-frame-factory.js').K_ViewFrame} K_ViewFrame
 * @typedef {import('../components/toast-factory.js').K_Toast} K_Toast
 * @typedef {import('../components/logger-factory.js').K_Logger} K_Logger
 */

import _ from '../../lib/utility.js';

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
 * @param {Object} routeParams - Injected route parameters service.
 * @param {string} routeParams.consumerId - The consumer id in edit mode.
 * @param {K_Ajax} ajax - Custom AJAX provider.
 * @param {K_ViewFrame} viewFrame - Custom view frame factory.
 * @param {K_Toast} toast - Custom toast message service.
 * @param {K_Logger} logger - Custom logger factory service.
 */
export default function ConsumerEditController(window, scope, location, routeParams, ajax, viewFrame, toast, logger) {
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

            // notebook.addClass('hidden');
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
        const request = ajax.request({method: ajaxConfig.method, endpoint: ajaxConfig.endpoint, data: payload});

        event.preventDefault();

        request.then(({data: response, httpText}) => {
            const level = scope.consumerId === '__none__' ? 'SUCCESS' : 'INFO';

            toast.message(level, 'Consumer details saved.');
            logger.info(httpText);

            if (level === 'SUCCESS') {
                window.location.href = _.editPath(location.path(), response.id);
            }
        });

        request.catch(({data: error, httpText}) => {
            toast.error('Could not save consumer details.');
            logger.exception(httpText, error);
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

        const request = ajax.post({endpoint: `/consumers/${scope.consumerId}/${authMethod}`, data: payload});

        event.preventDefault();

        request.then(({data: response, httpText}) => {
            scope.userAuthList[authName].push(response);

            /* Clear the form */
            scope.userAuthModel[authName] = _.deepClone(UserAuthModel[authName]);

            toast.success('Authentication method saved.');
            logger.info(httpText);
        });

        request.catch(({data: error, httpText}) => {
            toast.error('Could not save authentication method.');
            logger.exception(httpText, error);
        });

        return false;
    };

    scope.fetchAuthList = function (method) {
        const authName = _.dashToCamel(method);

        if (typeof scope.userAuthList[authName] === 'undefined') {
            return false;
        }

        const endpoint = `/consumers/${scope.consumerId}/${method}`;
        const request = ajax.get({endpoint});

        request.then(({data: response, httpText}) => {
            scope.userAuthList[authName] = response.data;
            logger.info(httpText);
        });

        request.catch(({data: error, httpText}) => {
            toast.error('Could not load authentication details');
            logger.exception(httpText, error);
        });

        return true;
    };

    scope.fetchPluginList = function () {
        const endpoint = `/consumers/${scope.consumerId}/plugins`;
        const request = ajax.get({endpoint});

        request.then(({data: response, httpText}) => {
            for (let plugin of response.data) {
                scope.pluginList.push({
                    id: plugin.id,
                    name: plugin.name,
                    enabled: plugin.enabled
                });
            }

            logger.info(httpText);
        });

        request.catch(({data: error, httpText}) => {
            toast.warning('Could not fetch consumer plugins.');
            logger.exception(httpText, error);
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
        const request = ajax.get({endpoint: `/consumers/${scope.consumerId}`});

        request.then(({data: response, httpText}) => {
            for (let field in response) {
                if (typeof scope.consumerModel[field] === 'undefined' || response[field] === null) {
                    continue;
                }

                scope.consumerModel[field] = response[field];
            }

            viewFrame.addAction('Delete', '#!/consumers', 'critical delete', 'consumer', `/ca_certificates/${scope.consumerId}`);
            logger.info(httpText);
        });

        request.catch(({data: error, httpText}) => {
            toast.error('Could not load consumer details');
            logger.exception(httpText, error);

            window.location.href = viewFrame.prevUrl;
        });

        scope.fetchAuthList('key-auth');
        scope.fetchPluginList(`/consumers/${scope.consumerId}/plugins`);
    }
}
