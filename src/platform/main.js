/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const electron = require('electron');
const ospath = require('ospath');

const APP_NAME = 'KongDash';
const VERSION = '0.3.0';

const ConfigManager = require('./config/config-manager');
const ThemeScanner = require('./theme/theme-scanner');

const {RendererWindow} = require('./renderer/window');
const {ipcServer} = require('./ipc/ipc-server');

const configManager = new ConfigManager(ospath.data() + `/${APP_NAME}/v${VERSION}`);
const themeScanner = new ThemeScanner();

const rendererWindow = new RendererWindow({title: APP_NAME});
rendererWindow.enableDebugging();

const {app} = electron;
const connectionMap = {};

app.setName(APP_NAME);

app.on('ready', async () => {
    rendererWindow.create();

    await themeScanner.scanThemes();
    await rendererWindow.showBootstrap();
});

app.on('activate', () => {
    rendererWindow.create();
});

app.on('will-quit', () => {
    configManager.saveState();
    ipcServer.removeListeners();
});

ipcServer.registerRequestHandler('Write-Connection', (event, payload) => {
    try {
        const connection = configManager.writeConnection(payload);
        connectionMap[`window${event.senderId}`] = connection.id;

        return connection;
    } catch (error) {
        return {message: `${error}`};
    }
});

ipcServer.registerRequestHandler('Write-Workbench-Config', (event, config) => {
    return configManager.writeWorkbenchConfig(config);
});

ipcServer.registerRequestHandler('Read-Default-Connection', () => {
    return configManager.getDefaultConnection();
});

ipcServer.registerRequestHandler('Read-Workbench-Config', () => {
    return configManager.getWorkbenchConfig();
});

ipcServer.registerRequestHandler('Destroy-Workbench-Session', async (event) => {
    if (typeof connectionMap[`window${event.senderId}`] !== 'undefined') {
        delete connectionMap[`window${event.senderId}`];
        configManager.removeDefaultConnection();
    }

    return await rendererWindow.showBootstrap();
});

ipcServer.registerRequestHandler('Read-Theme-Style', async (event, payload) => {
    return await themeScanner.readStyle(payload.themeUID);
});

ipcServer.registerRequestHandler('Create-Workbench-Session', async (event, payload) => {
    connectionMap[`window${event.senderId}`] = payload.connectionId;
    await rendererWindow.showDashboard();

    return null;
});

ipcServer.registerRequestHandler('Read-Connection-List', () => {
    return configManager.getAllConnections();
});

ipcServer.registerQueryHandler('Read-Default-Connection', () => {
    return configManager.getDefaultConnection();
});

ipcServer.registerRequestHandler('Read-Session-Connection', (event) => {
    return configManager.getConnectionById(connectionMap[`window${event.senderId}`]);
});

ipcServer.registerRequestHandler('Read-Theme-List', async () => {
    return await themeScanner.scanThemes();
});

ipcServer.registerQueryHandler('Read-Theme-Style', async (event, payload) => {
    try {
        return await themeScanner.readStyle(payload.themeUID);
    } catch (error) {
        return {message: `${error}`};
    }
});
