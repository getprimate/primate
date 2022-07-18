/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const os = require('node:os');
const electron = require('electron');

const {APP_NAME} = require('./constant/product');
const {DATA_PATH} = require('./constant/paths');
const {ipcServer} = require('./ipc/ipc-server');
const rendererManager = require('./renderer/manager');
const {menuTemplate} = require('./renderer/menu');

const {app, Menu} = electron;

app.setName(APP_NAME);
app.setPath('userData', DATA_PATH);

app.on('ready', async () => {
    try {
        const isCreated = await rendererManager.createMainWindow();
        if (isCreated) await rendererManager.loadBootstrap();
    } catch (e) {
        /* eslint-disable-next-line no-console */
        console.error(e);
        app.quit();
    }
});

app.on('browser-window-created', (event, window) => {
    let menu = Menu.buildFromTemplate(menuTemplate);

    if (os.type() === 'Darwin' || process.platform === 'darwin') {
        Menu.setApplicationMenu(menu);
    } else {
        window.setMenu(menu);
    }
});

app.on('activate', async () => {
    const isCreated = await rendererManager.createMainWindow();

    if (isCreated) {
        await rendererManager.loadBootstrap();
    }
});

app.on('will-quit', () => {
    rendererManager.writeConfigState();
    ipcServer.removeListeners();
});

app.on('window-all-closed', () => {
    rendererManager.clearSessions();

    if (os.type() !== 'Darwin') app.quit();
});
