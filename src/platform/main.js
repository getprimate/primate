'use strict';

const electron = require('electron');
const path = require('path');
const ospath = require('ospath');

const APP_NAME = 'KongDash';
const VERSION = '0.3.0';
const ABS_PATH = path.dirname(__dirname);

const ConfigManager = require('./config/config-manager');
const ThemeScanner = require('./theme/theme-scanner');

const {RendererWindow} = require('./renderer/window');
const {ipcServer} = require('./ipc/ipc-server');

const configManager = new ConfigManager(ospath.data() + `/${APP_NAME}/v${VERSION}`);
const themeScanner = new ThemeScanner([path.join(path.dirname(ABS_PATH), 'resources', 'themes')]);

const rendererWindow = new RendererWindow({title: APP_NAME});
rendererWindow.enableDebugging();

const {app, ipcMain} = electron;
const connectionMap = {};

let themeDefs = {};

themeScanner.scanThemes().then((defs) => {
    themeDefs = defs;
});

app.setName(APP_NAME);

app.on('ready', async () => {
    rendererWindow.create();

    await rendererWindow.showBootstrap();
});

app.on('activate', () => {
    rendererWindow.create();
});

app.on('will-quit', () => {
    configManager.saveState();
    ipcMain.removeAllListeners();
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

ipcServer.registerRequestHandler('Destroy-Session', async (event) => {
    if (typeof connectionMap[`window${event.senderId}`] !== 'undefined') {
        delete connectionMap[`window${event.senderId}`];
        configManager.removeDefaultConnection();
    }

    try {
        await rendererWindow.showBootstrap();
    } catch (error) {
        return {message: `${error}`};
    }
});

ipcServer.registerRequestHandler('Update-Theme', async (event, payload) => {
    try {
        return await themeScanner.readStyle(payload.nonce);
    } catch (error) {
        return {message: `${error}`};
    }
});

ipcServer.registerQueryHandler('Read-All-Connections', () => {
    return configManager.getAllConnections();
});

ipcServer.registerQueryHandler('Read-Default-Connection', () => {
    return configManager.getDefaultConnection();
});

ipcServer.registerQueryHandler('Read-Session-Connection', (event) => {
    return configManager.getConnectionById(connectionMap[`window${event.sender.id}`]);
});

ipcServer.registerQueryHandler('Read-Workbench-Config', () => {
    return configManager.getWorkbenchConfig();
});

ipcServer.registerQueryHandler('Read-Theme-Defs', () => {
    return themeDefs;
});
