/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const os = require('node:os');
const path = require('node:path');
const {app, nativeImage, BrowserWindow} = require('electron');

const {PLATFORM_PATH, WORKBENCH_PATH, RESOURCES_PATH} = require('../constant/paths');

/**
 * @property {Electron.BrowserWindow} _window
 * @property {Electron.BrowserWindowConstructorOptions} _options
 */
class RendererWindow {
    /**
     * @param {Electron.BrowserWindowConstructorOptions} options
     */
    constructor(options) {
        let pixmap = '512x512.png';

        this._window = null;
        this._debug = app.isPackaged === false;

        switch (os.type()) {
            case 'Windows_NT':
                pixmap = 'app-scalable.ico';
                break;

            case 'Darwin':
                pixmap = 'app-scalable.icns';
                break;

            default:
                break;
        }

        const icon = nativeImage.createFromPath(path.join(RESOURCES_PATH, 'icons', pixmap));

        this._options = {
            backgroundColor: '#1A242D',
            width: 1570,
            height: 800,
            center: true,
            title: 'Primate',
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

        if (os.type() === 'Darwin') {
            app.dock.setIcon(icon);
        }
    }

    create() {
        if (this._window !== null) {
            return false;
        }

        const browserWindow = new BrowserWindow(this._options);

        browserWindow.on('closed', () => {
            this._window = null;
        });

        this._window = browserWindow;
        return true;
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

module.exports = RendererWindow;
