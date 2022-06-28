/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import * as _ from '../lib/core-toolkit.js';
import {
    editViewURL,
    urlOffset,
    urlQuery,
    simplifyObjectId,
    patchMethodInitiator,
    deleteMethodInitiator
} from '../helpers/rest-toolkit.js';
import {switchTabInitiator} from '../helpers/notebook.js';

import consumerModel from '../models/consumer-model.js';
import userAuthModel from '../models/user-auth-model.js';
import {epochToDate} from '../helpers/date-lib.js';

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
    const restConfig = {method: 'POST', endpoint: '/consumers'};
    const eventLocks = {submitConsumerForm: false, submitAuthForm: false};

    let loaderSteps = 0;

    scope.ENUM_JWT_ALGO = ['HS256', 'HS384', 'HS512', 'RS256', 'ES256'];

    scope.consumerId = '__none__';
    scope.consumerModel = _.deepClone(consumerModel);
    scope.userAuthModel = _.deepClone(userAuthModel);

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
     * Deletes the table row entry upon clicking the bin icon.
     *
     * @type {function(Event): boolean}
     */
    scope._deleteTableRow = deleteMethodInitiator(restClient, (err, properties) => {
        if (_.isText(err)) toast.error(err);
        else toast.success(`${properties.target} deleted successfully.`);
    });

    /**
     * Handles click events on action buttons on table rows.
     *
     * @private
     * @param {Event} event - The event object.
     * @param {HTMLInputElement} event.target - The input HTML element.
     * @return {boolean} True if event handled, false otherwise.
     */
    scope._togglePluginState = patchMethodInitiator(restClient, (err) => {
        if (_.isText(err)) toast.error('Unable to update plugin state.');
        else toast.success('Plugin state updated successfully.');
    });

    /**
     * Submits the consumer form data.
     *
     * @param {Event} event - The current event object.
     * @returns {boolean} True if request could be made, false otherwise.
     */
    scope.submitConsumerForm = function (event) {
        event.preventDefault();

        if (eventLocks.submitConsumerForm === true) {
            return false;
        }

        const fields = Object.keys(scope.consumerModel);

        for (let field of fields) {
            if (_.isText(scope.consumerModel[field])) {
                scope.consumerModel[field] = scope.consumerModel[field].trim();
            }
        }

        if (_.isEmpty(scope.consumerModel.username) && _.isEmpty(scope.consumerModel.custom_id)) {
            toast.error('Please provide either username or consumer id.');
            return false;
        }

        const payload = _.deepClone(scope.consumerModel);

        eventLocks.submitConsumerForm = true;
        viewFrame.setLoaderSteps(1);

        if (_.isEmpty(scope.consumerModel.custom_id)) {
            payload.custom_id = null;
        }

        if (_.isEmpty(scope.consumerModel.username)) {
            payload.username = null;
        }

        const request = restClient.request({method: restConfig.method, endpoint: restConfig.endpoint, payload});

        request.then(({data: response}) => {
            const redirectURL = editViewURL(location.path(), response.id);
            const displayText = _.isText(response.username) ? response.username : simplifyObjectId(response.id);

            if (_.isNone(scope.consumerId)) {
                const createdAt = epochToDate(response.created_at, viewFrame.getConfig('dateFormat'));

                scope.consumerId = response.id;

                restConfig.method = 'PATCH';
                restConfig.endpoint = `${restConfig.endpoint}/${scope.consumerId}`;
            }

            viewFrame.popBreadcrumb();
            viewFrame.addBreadcrumb(redirectURL, displayText);

            toast.success('Consumer details saved successfully.');
        });

        request.catch(() => {
            toast.error('Unable to save consumer details.');
        });

        request.finally(() => {
            eventLocks.submitConsumerForm = false;
            viewFrame.incrementLoader();
        });

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
        viewFrame.setLoaderSteps(1);

        const {target} = event;
        const {authMethod} = target.dataset;

        const authName = _.dashToCamel(authMethod);
        const authWrap = scope.userAuthModel[authName];

        const payload = _.deepClone(authWrap);

        for (let field in authWrap) {
            if (_.isText(authWrap[field]) && authWrap[field].length === 0) {
                delete payload[field];
            }
        }

        const request = restClient.post(`/consumers/${scope.consumerId}/${authMethod}`, payload);

        request.then(({data: response}) => {
            scope.userAuthList[authName].push(response);

            /* Clear the form */
            scope.userAuthModel[authName] = _.deepClone(userAuthModel[authName]);

            toast.success('Authentication method saved successfully.');
        });

        request.catch(() => {
            toast.error('Unable to save authentication method.');
        });

        request.finally(() => {
            eventLocks.submitAuthForm = false;
            viewFrame.incrementLoader();
        });

        return false;
    };

    /**
     * Resets all form elements in a generic way.
     *
     * @param {Event} event - The reset button click event.
     * @return {boolean} True if reset, false otherwise.
     */
    scope.resetGenericForm = function (event) {
        event.preventDefault();

        const {target} = event;

        if (target.nodeName !== 'BUTTON') {
            return false;
        }

        const {value: modelField} = target;
        const proceed = confirm('Proceed to clear the form?');

        if (proceed === false) {
            return proceed;
        }

        if (modelField === 'consumerModel') {
            if (eventLocks.submitConsumerForm === true) {
                return false;
            }

            scope.consumerModel = _.deepClone(consumerModel);
        } else if (_.isObject(scope.userAuthModel[modelField])) {
            if (eventLocks.submitAuthForm === true) {
                return false;
            }

            scope.userAuthModel[modelField] = _.deepClone(userAuthModel[modelField]);
        } else {
            return false;
        }

        return proceed;
    };

    /**
     * Retrieves the list of added authentication methods.
     *
     * @param {string} method - The authentication method name.
     * @returns {boolean} True if request could be made, false otherwise.
     */
    scope.fetchAuthList = function (method) {
        const authName = _.dashToCamel(method);

        if (_.isNil(scope.userAuthList[authName])) {
            return false;
        }

        const request = restClient.get(`/consumers/${scope.consumerId}/${method}`);

        viewFrame.setLoaderSteps(1);

        request.then(({data: response}) => {
            for (let authItem of response.data) {
                if (Array.isArray(authItem.redirect_uris)) {
                    authItem.redirect_uris = authItem.redirect_uris.join(', ');
                }
            }

            scope.userAuthList[authName] = response.data;
        });

        request.catch(() => {
            toast.error(`Unable to fetch ${method} authentication details.`);
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });

        return true;
    };

    /**
     * Retrieves the list of plugins applied on this consumer.
     */
    scope.fetchAppliedPlugins = function (filters = null) {
        const request = restClient.get(`/consumers/${scope.consumerId}/plugins` + urlQuery(filters));

        viewFrame.setLoaderSteps(1);

        request.then(({data: response}) => {
            scope.pluginNext.offset = urlOffset(response.next);

            for (let plugin of response.data) {
                scope.pluginList.push({
                    id: plugin.id,
                    enabled: plugin.enabled,
                    displayText: plugin.name,
                    subTagsText: _.isEmpty(plugin.tags) ? 'No associated tags.' : _.implode(plugin.tags)
                });
            }
        });

        request.catch(() => {
            toast.warning('Unable to fetch consumer plugins.');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });
    };

    /**
     * Switches between authentication forms.
     */
    scope.switchAuthTab = switchTabInitiator((dataset) => {
        const {authMethod} = dataset;
        scope.fetchAuthList(authMethod);
    });

    /**
     * Handles click events on the table widgets.
     *
     * @param {Event} event - The current event object
     * @return {boolean} True if event handled, false otherwise
     */
    scope.handleTableClickEvents = function (event) {
        const {target} = event;

        switch (target.nodeName) {
            case 'INPUT':
                return scope._togglePluginState(event);

            default:
                return scope._deleteTableRow(event);
        }
    };

    viewFrame.clearBreadcrumbs();
    viewFrame.addBreadcrumb('/consumers', 'Consumers');

    switch (routeParams.consumerId) {
        case '__create__':
            viewFrame.setTitle('Add New Consumer');
            viewFrame.addBreadcrumb(location.path(), 'Create +');
            break;

        default:
            restConfig.method = 'PATCH';
            restConfig.endpoint = `${restConfig.endpoint}/${routeParams.consumerId}`;
            scope.consumerId = routeParams.consumerId;
            viewFrame.setTitle('Edit Consumer');

            loaderSteps = loaderSteps + 2;

            break;
    }

    viewFrame.setLoaderSteps(loaderSteps);
    viewFrame.incrementLoader();

    if (restConfig.method === 'PATCH' && scope.consumerId !== '__none__') {
        const request = restClient.get(`/consumers/${scope.consumerId}`);

        request.then(({data: response}) => {
            const fieldList = Object.keys(response);
            const createdAt = epochToDate(response.created_at, viewFrame.getConfig('dateFormat'));

            for (let field of fieldList) {
                if (_.isNil(scope.consumerModel[field]) || _.isNil(response[field])) {
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

            viewFrame.addBreadcrumb(
                location.path(),
                _.isText(response.username) ? response.username : simplifyObjectId(response.id)
            );
        });

        request.catch(() => {
            toast.error('Unable to fetch consumer details.');
            window.location.href = '#!/consumers';
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });

        scope.fetchAuthList('key-auth');
        scope.fetchAppliedPlugins(`/consumers/${scope.consumerId}/plugins`);
    }
}
