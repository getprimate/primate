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
import {deepClone, isDefined} from '../../lib/core-toolkit.js';

const {/** @type {IPCBridge} */ ipcBridge} = window;

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
    scope.connectionId = viewFrame.getConfig('sessionId');

    scope.themeDefs = {};
    scope.workbenchConfig = {};

    ipcBridge.onResponse('Write-Connection', (payload) => {
        if (!_.isObject(payload) || !_.isText(payload.id)) {
            toast.error('Unable to save connection.');
            return false;
        }

        if (payload.isRemoved === true) {
            toast.success('Connection removed successfully.');
            return true;
        }

        scope.$apply((_this) => {
            _this.connectionList[payload.id] = payload;
        });

        toast.success('Connection updated successfully.');
        return true;
    });

    scope.queryConnectionList = function () {
        const connectionList = ipcBridge.sendQuery('Read-All-Connections');

        if (typeof connectionList.error === 'string') {
            return false;
        }

        const connectionIds = Object.keys(connectionList);

        for (let id of connectionIds) {
            if (id === scope.connectionId) {
                scope.connectionModel = deepClone(connectionList[id]);
                break;
            }
        }

        scope.connectionList = connectionList;
    };

    scope.queryWorkbenchSettings = function () {
        scope.themeDefs = ipcBridge.sendQuery('Read-Theme-Defs');

        scope.workbenchConfig.themeUID = '';
    };

    scope.handleConnectionClick = function (event) {
        const {target} = event;

        if (target.nodeName === 'TBODY') return false;

        let tableRow = target.nodeName === 'TR' ? target : target.closest('tr');
        let {connectionId} = tableRow.dataset;

        const tbody = tableRow.parentElement;

        if (target.nodeName === 'SPAN' && target.classList.contains('delete')) {
            ipcBridge.sendRequest('Write-Connection', {id: connectionId, isRemoved: true});

            delete scope.connectionList[connectionId];
            tbody.removeChild(tableRow);

            connectionId = scope.connectionId;
        }

        for (let tr of tbody.children) {
            if (tr.dataset.connectionId === connectionId) {
                tr.classList.add('active');
                continue;
            }

            tr.classList.remove('active');
        }

        if (_.isText(connectionId) && connectionId.length >= 5) {
            scope.connectionModel = deepClone(scope.connectionList[connectionId]);
            scope.connectionModel.id = connectionId;
        }

        return true;
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

        if (isDefined(scope.connectionModel.isDefault)) {
            delete scope.connectionModel.isDefault;
        }

        ipcBridge.sendRequest('Write-Connection', scope.connectionModel);

        return true;
    };

    scope.setWorkbenchTheme = function (event) {
        const {target} = event;

        if (target.nodeName === 'INPUT' && _.isText(target.value)) {
            ipcBridge.sendRequest('Read-Theme-Style', {themeUID: target.value});
            return true;
        }

        return false;
    };

    scope.switchNotebookTabs = switchTabInitiator((attributes) => {
        console.log(JSON.stringify(attributes));
    });

    viewFrame.clearBreadcrumbs();
    viewFrame.addBreadcrumb('#!/settings', 'Settings');

    scope.queryConnectionList();
    scope.queryWorkbenchSettings();

    scope.$on('$destroy', () => {
        ipcBridge.removeCallbacks('onResponse', 'Write-Connection');

        scope.connectionModel = null;
        scope.connectionList = null;

        delete scope.connectionModel;
        delete scope.connectionList;

        delete scope.updateConnection;
    });
}
