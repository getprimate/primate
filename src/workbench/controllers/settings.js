/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import _ from '../../lib/core-utils.js';
import setupModel from '../models/setup-model.js';
import {switchTabInitiator} from '../helpers/notebook.js';

const {/** @type {IPCHandler} */ ipcHandler} = window;

/**
 * Provides controller constructor for setting up the application.
 *
 * @constructor
 * @param {Object} scope - Injected scope object.
 * @param {RESTClientFactory} restClient - Customised HTTP REST client factory.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI attributes.
 * @param {ToastFactory} toast - Factory for displaying notifications.
 */
export default function SettingsController(scope, restClient, viewFrame, toast) {
    scope.setupModel = _.deepClone(setupModel);
    scope.connectionList = {};

    scope.themeList = [];

    ipcHandler.onRequestDone('Write-Connection', (payload) => {
        if (_.isObject(payload) && _.isText(payload.id)) {

            scope.$apply((_this) => {
                _this.connectionList[payload.id] = payload;
            });

            toast.success('Connection settings saved.');
        }
    });

    scope.queryConnectionList = function () {
        const connectionList = ipcHandler.sendQuery('Read-All-Connections', {});

        if (typeof connectionList.error === 'string') {
            return false;
        }

        scope.connectionList = connectionList;
    };

    scope.populateConnection = function (event) {
        const {target} = event;

        if (target.nodeName === 'TBODY') return false;

        const tableRow = (target.nodeName === 'TR') ? target : target.closest('tr');
        const {connectionId} = tableRow.dataset;

        if (_.isText(connectionId) && connectionId.length >= 5) {
            scope.setupModel.id = connectionId;
            scope.setupModel.protocol = scope.connectionList[connectionId]['protocol'];
            scope.setupModel.name = scope.connectionList[connectionId]['name'];
            scope.setupModel.adminHost = scope.connectionList[connectionId]['adminHost'];
            scope.setupModel.adminPort = scope.connectionList[connectionId]['adminPort'];
            scope.setupModel.colorCode = scope.connectionList[connectionId]['colorCode'];
            scope.setupModel.basicAuth.username = scope.connectionList[connectionId]['basicAuth']['username'];
            scope.setupModel.basicAuth.password = scope.connectionList[connectionId]['basicAuth']['password'];
        } else {
            scope.setupModel = _.deepClone(setupModel);
        }
    };

    /**
     * Attempts to connect to the specified server.
     *
     * @param {{target: Object, preventDefault: function}|null} event
     * @returns {boolean}
     */
    scope.updateConnection = function (event) {
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
        if (scope.setupModel.name.length === 0) {
            toast.error('Please set a name for this connection.');
            return false;
        }

        ipcHandler.sendRequest('Write-Connection', scope.setupModel);

        return true;
    };

    scope.switchNotebookTabs = switchTabInitiator();

    viewFrame.clearBreadcrumbs();
    viewFrame.addBreadcrumb('#!/settings', 'Settings');

    scope.queryConnectionList();

    scope.$on('$destroy', () => {
        ipcHandler.removeCallbacks('onRequestDone', 'Write-Connection');

        delete scope.setupModel;
        delete scope.connectionList;

        delete scope.populateConnection;
        delete scope.updateConnection;
    });
}
