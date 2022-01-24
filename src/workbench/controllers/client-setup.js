/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import _ from '../../lib/core-utils.js';
import setupModel from '../models/setup-model.js';

const {ipcRenderer} = require('electron');
const semver = require('semver');

const connectionList = [
    {
        id: '123-123-123-111',
        name: 'Kong Staging',
        host: '127.0.0.1',
        port: 8001,
        authentication: {
            basicAuth: {
                username: 'ajaysreedhar'
            }
        },
        connectionDate: '20 January, 2022'
    },

    {
        id: '123-123-123-112',
        name: 'Kong Production',
        host: '127.0.0.1',
        port: 8001,
        authentication: {
            basicAuth: {
                username: 'ajaysreedhar'
            }
        },
        connectionDate: '15 January, 2022'
    },

    {
        id: '123-123-123-113',
        name: 'Kong Local',
        host: '127.0.0.1',
        port: 8001,
        authentication: {
            basicAuth: {
                username: 'ajaysreedhar'
            }
        },
        connectionDate: '11 January, 2022'
    }
];

/**
 *
 * @param {{
 *     configuration: {kong_env: string},
 *     version: string
 * }} response
 */
function validateServerResponse(response) {
    if (!_.isObject(response.configuration) || !_.isText(response.configuration.kong_env)) {
        throw new Error('Unable to detect Kong Admin API running on the provided address.');
    }

    return response;
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
    scope.setupModel = _.deepClone(setupModel);
    scope.connectionList = connectionList;

    /**
     * Attempts to connect to the specified server.
     *
     * @param {Object} event
     * @returns {boolean}
     */
    scope.attemptConnection = function (event) {
        const {target} = event;

        event.preventDefault();

        for (let property in scope.setupModel) {
            if (_.isText(scope.setupModel[property])) {
                scope.setupModel[property] = scope.setupModel[property].trim();
            }
        }

        if (scope.setupModel.adminHost.length === 0) {
            toast.error('Please provide a valid host address.');
            return false;
        }
        if (target.nodeName === 'FORM' && scope.setupModel.name.length === 0) {
            toast.error('Please set a name for this connection.');
            return false;
        }

        const options = {
            url: `${scope.setupModel.protocol}://${scope.setupModel.adminHost}:${scope.setupModel.adminPort}`,
            method: 'GET',
            headers: {}
        };

        if (scope.setupModel.basicAuth.username.length >= 1) {
            const {basicAuth} = scope.setupModel;
            options.headers['Authorization'] = `${basicAuth.username}:${basicAuth.password}`;
        }

        const request = restClient.request(options);

        request.then(({data: response}) => {
            try {
                validateServerResponse(response);

                if (target.nodeName === 'BUTTON') toast.success('Test OK');
            } catch (error) {
                toast.error(error.message);
            }
        });

        request.catch(({data: error, xhrStatus, status}) => {
            if (xhrStatus === 'error') toast.error('Unable to connect to the host.');
            else if (status === 401) toast.error('User is unauthorized.');
            else toast.error(error.message);
        });

        return true;
    };
}
