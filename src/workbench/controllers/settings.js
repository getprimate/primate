/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import * as _ from '../../lib/core-toolkit.js';
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
    scope.connectionModel = _.deepClone(setupModel);
    scope.connectionList = {};

    scope.themeDefs = {};
    scope.workbenchConfig = {};

    ipcHandler.onRequestDone('Write-Connection', (payload) => {
        if (_.isObject(payload) && _.isText(payload.id)) {
            scope.$apply((_this) => {
                _this.connectionList[payload.id] = payload;
            });

            toast.success('Connection settings saved.');
        }
    });

    scope.queryConnectionList = function () {
        const connectionList = ipcHandler.sendQuery('Read-All-Connections');

        if (typeof connectionList.error === 'string') {
            return false;
        }

        scope.connectionList = connectionList;
    };

    scope.queryWorkbenchSettings = function () {
        scope.workbenchConfig = ipcHandler.sendQuery('Read-Theme-Defs');
        scope.themeDefs = ipcHandler.sendQuery('Read-Theme-Defs');

        scope.workbenchConfig.nonce = '';
    };

    scope.populateConnection = function (event) {
        const {target} = event;

        if (target.nodeName === 'TBODY') return false;

        const tableRow = target.nodeName === 'TR' ? target : target.closest('tr');
        const {connectionId} = tableRow.dataset;

        const tbody = tableRow.closest('tbody');

        for (let tr of tbody.children) {
            tr.classList.remove('active');
        }

        tableRow.classList.add('active');

        if (_.isText(connectionId) && connectionId.length >= 5) {
            scope.connectionModel.id = connectionId;
            scope.connectionModel.protocol = scope.connectionList[connectionId]['protocol'];
            scope.connectionModel.name = scope.connectionList[connectionId]['name'];
            scope.connectionModel.adminHost = scope.connectionList[connectionId]['adminHost'];
            scope.connectionModel.adminPort = scope.connectionList[connectionId]['adminPort'];
            scope.connectionModel.colorCode = scope.connectionList[connectionId]['colorCode'];
            scope.connectionModel.basicAuth.username = scope.connectionList[connectionId]['basicAuth']['username'];
            scope.connectionModel.basicAuth.password = scope.connectionList[connectionId]['basicAuth']['password'];
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

        for (let property in scope.connectionModel) {
            if (_.isText(scope.connectionModel[property])) {
                scope.connectionModel[property] = scope.connectionModel[property].trim();
            }
        }

        if (scope.connectionModel.adminHost.length === 0) {
            toast.error('Please provide a valid host address.');
            return false;
        }
        if (scope.connectionModel.name.length === 0) {
            toast.error('Please set a name for this connection.');
            return false;
        }

        ipcHandler.sendRequest('Write-Connection', scope.connectionModel);

        return true;
    };

    scope.setWorkbenchTheme = function (event) {
        const {target} = event;

        if (target.nodeName === 'INPUT' && _.isText(target.value)) {
            ipcHandler.sendRequest('Update-Theme', {nonce: target.value});
            return true;
        }

        return false;
    };

    scope.switchNotebookTabs = switchTabInitiator();

    viewFrame.clearBreadcrumbs();
    viewFrame.addBreadcrumb('#!/settings', 'Settings');

    scope.queryConnectionList();
    scope.queryWorkbenchSettings();

    scope.$on('$destroy', () => {
        ipcHandler.removeCallbacks('onRequestDone', 'Write-Connection');

        scope.connectionModel = null;
        scope.connectionList = null;

        delete scope.connectionModel;
        delete scope.connectionList;

        delete scope.populateConnection;
        delete scope.updateConnection;
    });
}
