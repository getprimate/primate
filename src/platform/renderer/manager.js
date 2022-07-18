/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const path = require('node:path');
const {shell} = require('electron');

const {APP_NAME} = require('../constant/product');
const {DATA_PATH} = require('../constant/paths');
const RendererWindow = require('./window');
const ConfigManager = require('../config/config-manager');
const ThemeScanner = require('../theme/theme-scanner');
const {ipcServer} = require('../ipc/ipc-server');

const RUNNING = {
    themesLoaded: false,
    sessions: {},
    mainWindow: null
};

const configManager = new ConfigManager(path.join(DATA_PATH, 'User-Config'));
const themeScanner = new ThemeScanner([path.join(DATA_PATH, 'User-Themes')]);

RUNNING.mainWindow = new RendererWindow({title: APP_NAME});

async function createMainWindow() {
    const isCreated = RUNNING.mainWindow.create();

    if (RUNNING.themesLoaded === false) {
        await themeScanner.scanThemes();
        RUNNING.themesLoaded = true;
    }

    return isCreated;
}

async function loadBootstrap() {
    return await RUNNING.mainWindow.showBootstrap();
}

function writeConfigState() {
    configManager.saveState();
}

function clearSessions() {
    const keys = Object.keys(RUNNING.sessions);

    for (let key of keys) {
        delete RUNNING.sessions[key];
    }
}

ipcServer.registerRequestHandler('Write-Connection-Config', (event, payload) => {
    return configManager.writeConnection(payload);
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

ipcServer.registerRequestHandler('Read-Connection-List', () => {
    return configManager.getAllConnections();
});

ipcServer.registerQueryHandler('Read-Default-Connection', () => {
    return configManager.getDefaultConnection();
});

ipcServer.registerRequestHandler('Read-Session-Connection', (event) => {
    return configManager.getConnectionById(RUNNING.sessions[`window${event.senderId}`]);
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

ipcServer.registerRequestHandler('Destroy-Workbench-Session', async (event) => {
    if (typeof RUNNING.sessions[`window${event.senderId}`] !== 'undefined') {
        delete RUNNING.sessions[`window${event.senderId}`];
        configManager.removeDefaultConnection();
    }

    return await RUNNING.mainWindow.showBootstrap();
});

ipcServer.registerRequestHandler('Read-Theme-Style', async (event, payload) => {
    return await themeScanner.readStyle(payload.themeUID);
});

ipcServer.registerRequestHandler('Create-Workbench-Session', async (event, session) => {
    if (typeof session.sessionId === 'string' && session.sessionId.length >= 16) {
        RUNNING.sessions[`window${event.senderId}`] = session.sessionId;
    } else if (typeof session.adminHost === 'string' && typeof session.protocol === 'string') {
        const connection = configManager.writeConnection(session);
        RUNNING.sessions[`window${event.senderId}`] = connection.id;
    }

    await RUNNING.mainWindow.showDashboard();
    return {};
});

ipcServer.registerRequestHandler('Open-External-Link', async (event, payload) => {
    await shell.openExternal(payload.url);
    return {};
});

module.exports = {
    createMainWindow,
    loadBootstrap,
    writeConfigState,
    clearSessions
};
