/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import {deepClone, isText, isObject, isNil} from '../lib/core-toolkit.js';
import {errorCode, WorkbenchError} from '../exception/error.js';
import setupModel from '../models/setup-model.js';

/**
 * IPC bridge exposed over isolated context.
 *
 * @type {IPCBridge}
 */
const ipcBridge = window.ipcBridge;
const cache = {unloadTimeout: null};

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
    ipcBridge.sendRequest('Read-Connection-List');
    document.body.removeChild(document.getElementById('loaderWrapper'));
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
    scope.connectionList = {};
    scope.savedItemCount = 0;

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

        const url = `${setupModel.protocol}://${setupModel.adminHost}:${setupModel.adminPort}`;
        const options = {method: 'GET', headers: {}, url};

        if (scope.setupModel.basicAuth.username.length >= 1) {
            const {basicAuth} = scope.setupModel;
            options.headers['Authorization'] = `${basicAuth.username}:${basicAuth.password}`;
        }

        const request = restClient.request(options);

        request.then(({data: response}) => {
            try {
                validateServerResponse(response);

                if (target.nodeName === 'BUTTON') {
                    toast.success('Test OK');
                    return true;
                }

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

    /* Populate connection list upon Read-Connection-List event response. */
    ipcBridge.onResponse('Read-Connection-List', (connectionList) => {
        if (isText(connectionList.error)) {
            toast.warning('Unable to display connection history.');
            return false;
        }

        scope.$apply((this_) => {
            this_.connectionList = connectionList;
            this_.savedItemCount = Object.keys(this_.connectionList).length;
        });
    });

    if (restClient.isConfigured() && isText(viewFrame.getConfig('sessionId'))) {
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
