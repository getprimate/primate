/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const path = require('path');
const {app, nativeImage, Menu, BrowserWindow} = require('electron');

const {ROOT_PATH, PLATFORM_PATH, WORKBENCH_PATH} = require('../constant/paths');
const {menuTemplate} = require('./menu');

/**
 * @property {Electron.BrowserWindow} _window
 * @property {Electron.BrowserWindowConstructorOptions} _options
 */
class RendererWindow {
    /**
     * @param {Electron.BrowserWindowConstructorOptions} options
     */
    constructor(options) {
        this._window = null;
        this._debug = false;

        const icon = nativeImage.createFromPath(path.join(ROOT_PATH, 'kongdash-512x512.png'));

        this._options = {
            backgroundColor: '#1A242D',
            width: 1570,
            height: 800,
            center: true,
            title: 'KongDash',
            minWidth: 1280,
            minHeight: 800,
            icon,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(PLATFORM_PATH, 'preload.js')
            }
        };

        const optionFields = Object.keys(options);

        for (let field of optionFields) {
            if (typeof this._options[field] !== 'undefined') {
                this._options[field] = optionFields[field];
            }
        }
    }

    create() {
        const browserWindow = new BrowserWindow(this._options);

        browserWindow.on('closed', () => {
            this._window = null;
        });

        this._window = browserWindow;
    }

    async showBootstrap() {
        if (!(this._window instanceof BrowserWindow)) {
            throw new Error('Browser window is not initialized yet!');
        }

        try {
            await this._window.loadFile(path.join(WORKBENCH_PATH, 'bootstrap.html'));

            if (this._debug === true) {
                this._window.webContents.openDevTools();
            }
        } catch (error) {
            throw new Error(`Unable to load bootstrap HTML file. ${error.message}`);
        }
    }

    async showDashboard() {
        if (!(this._window instanceof BrowserWindow)) {
            throw new Error('Browser window is not initialized yet!');
        }

        try {
            await this._window.loadFile(path.join(WORKBENCH_PATH, 'dashboard.html'));
        } catch (error) {
            throw new Error(`Unable to load bootstrap HTML file. ${error.message}`);
        }
    }

    enableDebugging() {
        this._debug = true;
    }

    disableDebugging() {
        this._debug = false;
    }
}

app.on('browser-window-created', (event, window) => {
    let menu = Menu.buildFromTemplate(menuTemplate);

    if (process.platform === 'darwin' || process.platform === 'mas') {
        Menu.setApplicationMenu(menu);
    } else {
        window.setMenu(menu);
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

module.exports = {RendererWindow};
