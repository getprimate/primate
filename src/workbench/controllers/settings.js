/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import * as _ from '../lib/core-toolkit.js';
import {greaterThan} from '../lib/version-utils.js';
import {epochToDate} from '../helpers/date-lib.js';
import {switchTabInitiator} from '../helpers/notebook.js';
import {FetchReleaseInfo} from '../helpers/release-repo.js';
import setupModel from '../models/setup-model.js';

/**
 * Functions exposed over the isolated context.
 */
const {
    /** @type {IPCBridge} */
    ipcBridge,
    appBridge
} = window;

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
    const fetchReleaseInfo = FetchReleaseInfo.bind({_restClient: restClient});
    const request = fetchReleaseInfo('latest');

    scope.ENUM_DATE_FORMAT = [
        {nodeValue: 'en-US', displayText: '01/31/2022'},
        {nodeValue: 'en-IN', displayText: '31/01/2022'},
        {nodeValue: 'standard', displayText: 'Mon Jan 31 2022'}
    ];

    scope.installedVersion = appBridge.getVersion();
    scope.latestVersion = 'Checking...';
    scope.downloadLink = '';

    scope.connectionId = viewFrame.getConfig('sessionId');
    scope.connectionModel = _.deepClone(setupModel);
    scope.connectionList = {};

    scope.credentialModel = {username: '', password: ''};

    scope.themeList = [];
    scope.workbenchConfig = {};

    scope.setWorkbenchTheme = function (event) {
        const {target} = event;

        if (target.nodeName !== 'INPUT' || _.isNil(target.value)) {
            return false;
        }

        const {value: themeUID} = target;

        scope.workbenchConfig.themeUID = themeUID;
        ipcBridge.sendRequest('Read-Theme-Style', {themeUID});

        return true;
    };

    /**
     * Edits the selected connection.
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

        if (_.isDefined(scope.connectionModel.isDefault)) {
            delete scope.connectionModel.isDefault;
        }

        if (scope.credentialModel.username.length >= 1) {
            const {credentialModel: credentials} = scope;
            scope.connectionModel.basicAuth.credentials = btoa(`${credentials.username}:${credentials.password}`);
        }

        ipcBridge.sendRequest('Write-Connection-Config', scope.connectionModel);

        if (scope.connectionModel.id === viewFrame.getConfig('sessionId')) {
            viewFrame.setConfig('sessionName', scope.connectionModel.name);
            viewFrame.setConfig('sessionColor', scope.connectionModel.colorCode);
        }

        return true;
    };

    scope.handleConnectionClick = function (event) {
        const {target} = event;

        if (target.nodeName === 'TBODY') return false;

        let tableRow = target.nodeName === 'TR' ? target : target.closest('tr');
        let {connectionId} = tableRow.dataset;

        const tbody = tableRow.parentElement;

        scope.credentialModel.username = scope.credentialModel.password = '';

        if (target.nodeName === 'SPAN' && target.classList.contains('delete')) {
            ipcBridge.sendRequest('Write-Connection-Config', {id: connectionId, isRemoved: true});

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
            scope.connectionModel = _.deepClone(scope.connectionList[connectionId]);
            scope.connectionModel.id = connectionId;
        }

        return true;
    };

    /**
     * Handles switch-tab events.
     *
     * @type {function(Event): boolean}
     */
    scope.switchNotebookTabs = switchTabInitiator((attributes) => {
        const {configTarget} = attributes;

        switch (configTarget) {
            case 'themes':
            case 'workbench':
                if (Object.keys(scope.workbenchConfig).length === 0) ipcBridge.sendRequest('Read-Workbench-Config');
                break;

            default:
                break;
        }
    });

    /**
     * Applies Workbench config.
     */
    scope.applyWorkbenchConfig = function (event) {
        event.preventDefault();

        viewFrame.setConfig('dateFormat', scope.workbenchConfig.dateFormat);
        viewFrame.setConfig('showBreadcrumbs', scope.workbenchConfig.showBreadcrumbs);
        viewFrame.setConfig('showFooter', scope.workbenchConfig.showFooter);

        return true;
    };

    request.then(({releaseIndex}) => {
        const isAvailable = greaterThan(releaseIndex.latest.stable, scope.installedVersion);

        scope.$apply((scope_) => {
            scope_.latestVersion = releaseIndex.latest.stable;

            if (isAvailable) {
                scope_.downloadLink = 'https://www.getprimate.xyz/download';
            }
        });
    });

    request.catch(() => {
        toast.warning('Unable to check for updates.');
    });

    /* Apply workbench config upon Read-Workbench-Config event response. */
    ipcBridge.onResponse('Read-Workbench-Config', (config) => {
        scope.$apply((this_) => {
            this_.workbenchConfig = config;
        });

        ipcBridge.sendRequest('Read-Theme-List');
    });

    /* Populate connection list upon Read-Connection-List event response. */
    ipcBridge.onResponse('Read-Connection-List', (connectionList) => {
        if (_.isText(connectionList.error)) {
            toast.warning('Unable to display connection history.');
            return false;
        }

        const connectionIds = Object.keys(connectionList);

        for (let id of connectionIds) {
            let timestamp = parseInt(connectionList[id]['createdAt']);

            if (!isNaN(timestamp)) {
                connectionList[id]['createdAt'] = epochToDate(timestamp / 1000, viewFrame.getConfig('dateFormat'));
            }

            if (id === scope.connectionId) {
                scope.connectionModel = _.deepClone(connectionList[id]);
                break;
            }
        }

        scope.$apply((this_) => {
            this_.connectionList = connectionList;
        });
    });

    /* Populate themes upon Read-Theme-List event response. */
    ipcBridge.onResponse('Read-Theme-List', (themeList) => {
        scope.$apply((this_) => {
            this_.themeList = Object.values(themeList);
        });
    });

    /* Remove deleted connections. */
    ipcBridge.onResponse('Write-Connection-Config', (payload) => {
        if (!_.isObject(payload) || !_.isText(payload.id)) {
            toast.error('Unable to save connection.');
            return false;
        }

        if (payload.isRemoved === true) {
            toast.success('Connection removed successfully.');
            return true;
        }

        scope.$apply((this_) => {
            this_.connectionList[payload.id] = payload;
        });

        toast.success('Connection updated successfully.');
        return true;
    });

    ipcBridge.sendRequest('Read-Connection-List');

    viewFrame.clearBreadcrumbs();
    viewFrame.setTitle('Settings');
    viewFrame.addBreadcrumb('/settings', 'Settings');

    /* Cleanup. */
    scope.$on('$destroy', () => {
        ipcBridge.removeCallbacks('Response', 'Read-Connection-List', 'Read-Theme-List', 'Read-Workbench-Config');
        ipcBridge.sendRequest('Write-Workbench-Config', scope.workbenchConfig);

        scope.connectionModel = null;
        scope.connectionList = null;

        delete scope.connectionModel;
        delete scope.connectionList;
    });
}
