/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import {deepClone, isText, isObject, isNil, isNone} from '../lib/core-toolkit.js';
import {errorCode, WorkbenchError} from '../exception/error.js';
import {epochToDate} from '../helpers/date-lib.js';
import setupModel from '../models/setup-model.js';

const {document} = window;

/**
 * IPC bridge exposed over isolated context.
 *
 * @type {IPCBridge}
 */
const ipcBridge = window.ipcBridge;
const cache = {isInitialized: false, unloadTimeout: null, connectionList: {}, savedItemCount: 0};

function requestWorkbenchSession(sessionId) {
    if (!isNil(cache.unloadTimeout)) {
        clearTimeout(cache.unloadTimeout);

        ipcBridge.removeListeners();
        ipcBridge.sendRequest('Create-Workbench-Session', {sessionId});
    }
}

/**
 * Validates response from the Admin API.
 *
 * @template T
 * @param {T} response - The response from the API server.
 * @return {T} The validated response object.
 */
function validateServerResponse(response) {
    if (!isObject(response.configuration) || !isText(response.configuration.kong_env)) {
        throw new WorkbenchError('Unable to detect Kong Admin API on the provided address.', errorCode.INVALID_HOST);
    }

    return response;
}

function removeSpinner() {
    if (cache.isInitialized === true) {
        return false;
    }

    ipcBridge.sendRequest('Read-Connection-List');
    document.body.removeChild(document.getElementById('loaderWrapper'));

    return true;
}

/**
 * Provides controller constructor for setting up the application.
 *
 * @constructor
 * @param {Object} scope - Injected scope object.
 * @param {RESTClientFactory} restClient - Customised HTTP REST client factory.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI attributes.
 * @param {ToastFactory} toast - Factory for displaying notifications.
 */

export default function ClientSetupController(scope, restClient, viewFrame, toast) {
    const eventLocks = {submitSetupForm: false};

    scope.setupModel = deepClone(setupModel);
    scope.connectionList = cache.connectionList;
    scope.savedItemCount = cache.savedItemCount;

    scope.credentials = {username: '', password: ''};

    /**
     * Attempts to connect to the specified server.
     *
     * @param {SubmitEvent|Object} event - The event object if triggered by user.
     */
    scope.attemptConnection = function (event) {
        if (eventLocks.submitSetupForm === true) {
            return false;
        }

        const {target} = event;
        const {setupModel} = scope;

        /* Sanitize and validate the model values. */
        const fieldList = Object.keys(setupModel);

        for (let field of fieldList) {
            if (isText(setupModel[field])) {
                setupModel[field] = setupModel[field].trim();
            }
        }

        if (target.nodeName === 'FORM') {
            event.preventDefault();

            if (setupModel.name.length === 0) {
                toast.error('Please set a name for this connection.');
                return false;
            }
        }

        if (setupModel.adminHost.length === 0) {
            toast.error('Please provide a valid host address.');
            return false;
        }

        eventLocks.submitSetupForm = true;
        viewFrame.setLoaderSteps(1);

        const url = `${setupModel.protocol}://${setupModel.adminHost}`;
        const options = {method: 'GET', headers: {}, url};

        if (scope.credentials.username.length >= 1) {
            const {credentials} = scope;

            options.headers['Authorization'] = btoa(`${credentials.username}:${credentials.password}`);
            scope.setupModel.basicAuth.credentials = options.headers['Authorization'];
        }

        const request = restClient.request(options);

        request.then(({data: response}) => {
            try {
                validateServerResponse(response);

                if (target.nodeName === 'BUTTON') {
                    toast.success('Test OK');
                    return true;
                }

                scope.setupModel.createdAt = Date.now();
                ipcBridge.sendRequest('Create-Workbench-Session', scope.setupModel);
            } catch (error) {
                toast.error(error.getMessage());
            }
        });

        request.catch(({data: error, xhrStatus, status}) => {
            if (xhrStatus === 'error') toast.error('Unable to connect to the host.');
            else if (status === 401) toast.error('User is unauthorized.');
            else toast.error(error.message);
        });

        request.finally(() => {
            eventLocks.submitSetupForm = false;
            viewFrame.incrementLoader();
        });

        return true;
    };

    /**
     * Picks the selected connection from the saved connection list.
     *
     * @param {Event} event - The click event object.
     * @return {boolean} True if action completed, false otherwise.
     */
    scope.pickSavedConnection = function (event) {
        const {target} = event;
        let tableRow = target;

        if (target.nodeName === 'TBODY') {
            return false;
        }

        if (target.nodeName !== 'TR') {
            tableRow = target.closest('tr');
        }

        const {connectionId} = tableRow.dataset;

        if (target.nodeName === 'SPAN' && target.classList.contains('delete')) {
            const proceed = confirm('Delete this connection?');

            if (proceed === true) {
                delete scope.connectionList[connectionId];
                ipcBridge.sendRequest('Write-Connection-Config', {id: connectionId, isRemoved: true});
            }

            /* Reset setup model form, if this connection is copied to the form. */
            if (scope.setupModel.id === connectionId) {
                scope.setupModel = deepClone(setupModel);
            }

            return proceed;
        }

        const fields = Object.keys(scope.connectionList[connectionId]);

        for (let field of fields) {
            scope.setupModel[field] = scope.connectionList[connectionId][field];
            scope.setupModel.id = connectionId;
        }

        return scope.attemptConnection({target: {nodeName: '__none__'}});
    };

    scope.updateConnectionList = function (connectionList) {
        const savedItemCount = Object.keys(connectionList).length;

        cache.isInitialized = true;

        if (isText(connectionList.error)) {
            toast.warning('Unable to display connection history.');
            return false;
        }

        if (savedItemCount === 0) {
            window.location.href = '#!/welcome';
            return true;
        }

        for (let id of Object.keys(connectionList)) {
            let timestamp = parseInt(connectionList[id]['createdAt']);

            if (!isNaN(timestamp)) {
                connectionList[id]['createdAt'] = epochToDate(timestamp / 1000, viewFrame.getConfig('dateFormat'));
            }
        }

        cache.connectionList = connectionList;
        cache.savedItemCount = savedItemCount;

        scope.$apply((this_) => {
            this_.connectionList = connectionList;
            this_.savedItemCount = savedItemCount;
        });
    };

    /* Populate connection list upon Read-Connection-List event response. */
    ipcBridge.onResponse('Read-Connection-List', scope.updateConnectionList);

    viewFrame.setTitle('Manage Connections');

    if (restClient.isConfigured() && !isNone(viewFrame.getConfig('sessionId'))) {
        const request = restClient.get('/');

        request.then(({data: response}) => {
            try {
                validateServerResponse(response);
            } catch (error) {
                toast.error(error.getMessage());
                return false;
            }

            cache.unloadTimeout = setTimeout(requestWorkbenchSession, 2000, viewFrame.getConfig('sessionId'));
            return true;
        });

        request.catch(() => {
            removeSpinner();
        });
    } else {
        removeSpinner();
    }
}
