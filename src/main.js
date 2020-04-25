'use strict';

const APP_NAME = 'KongDash';
const VERSION = '0.3.1';

const electron  = require('electron');
const path      = require('path');
const ospath = require('ospath');
const jsonfile  = require('jsonfile');

let absPath = path.dirname(__dirname), configFile = ospath.data() + '/' + APP_NAME + '/config.json';
let {app, ipcMain, BrowserWindow, Menu} = electron;
let mainWindow, appConfig = {kong: {}, app: {enableAnimation: true}};

let startMainWindow = function () {
    mainWindow = new BrowserWindow({
        backgroundColor: '#1A242D',
        width: 1100,
        height: 580,
        center: true,
        title: app.getName(),
        minHeight: 500,
        minWidth: 900,
        icon: absPath + '/kongdash-256x256.png'
    });
    mainWindow.loadURL('file://' + absPath + '/src/initialize.html');

    /* Debugging 
    mainWindow.webContents.openDevTools();
    //*/

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

app.setName(APP_NAME);

app.on('ready', () => {
    try {
        appConfig = jsonfile.readFileSync(configFile);

    } catch (e) {
        /* Ignore. Uses default settings. */
    } finally {
        startMainWindow();
    }
});

app.on('activate', () => {
    if (mainWindow === null) startMainWindow();
});

app.on('browser-window-created', (e, window) => {
    let menuTemplate = [{
        label: 'File',
        submenu: [{
            label: 'Settings',
            click: () => {
                mainWindow.webContents.send('open-settings-view', '');
            }
        }, { type: 'separator' }, { role: 'quit' }]
    }, {
        label: 'Edit',
        submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }]
    }, {
        label: 'Window',
        submenu: [{role: 'togglefullscreen'}]
    }, {
        label: 'Help',
        submenu: [{
            label: 'GitHub Repository',
            click: () => {
                electron.shell.openExternal('https://github.com/ajaysreedhar/kongdash');
            }
        }, {
            label: 'Report Issues',
            click: () => {
                electron.shell.openExternal('https://github.com/ajaysreedhar/kongdash/issues');
            }
        }, {
            type: 'separator'
        }, {
            label: 'About KongDash',
            click: () => {
                electron.shell.openExternal('https://ajaysreedhar.github.io/kongdash/');
            }
        }]
    }];

    let menu = Menu.buildFromTemplate(menuTemplate);

    if (process.platform === 'darwin' || process.platform === 'mas') {
        Menu.setApplicationMenu(menu);

    } else {
        window.setMenu(menu);
    }
});

app.on('window-all-closed', () => {
    if(process.platform !== 'darwin') app.quit();
});

ipcMain.on('get-config', (event, arg) => {
    if (arg === 'VERSION') {
        event.returnValue = VERSION;
        return;
    }

    event.returnValue = appConfig[arg];
});

ipcMain.on('write-config', (event, arg) => {
    appConfig[arg.name] = arg.config;

    jsonfile.writeFile(configFile, appConfig, function (error) {
        if (error) {
            event.sender.send('write-config-error', {message: 'Could not write configuration file.' + error});

        } else {
            event.sender.send('write-config-success', {message: 'Configuration saved successfully'});
        }
    });
});

ipcMain.on('open-external', (event, arg) => {
    electron.shell.openExternal(arg);
});
