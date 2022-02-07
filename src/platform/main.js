'use strict';

const electron = require('electron');
const path = require('path');
const ospath = require('ospath');

const APP_NAME = 'KongDash';
const VERSION = '0.3.0';
const ABS_PATH = path.dirname(__dirname);

const ConfigManager = require('./config/config-manager');
const ThemeScanner = require('./theme/theme-scanner');

const configManager = new ConfigManager(ospath.data() + `/${APP_NAME}/v${VERSION}`);
const themeScanner = new ThemeScanner([path.join(path.dirname(ABS_PATH), 'resources', 'themes')]);

let {app, ipcMain, BrowserWindow, Menu} = electron;
let mainWindow;
let themeDefs = {};

const connectionMap = {};

function sanitize(payload) {
    if (payload === null || typeof payload === 'undefined') {
        return {error: 'Requested entity is not available.', code: 'E404'};
    }

    return payload;
}

themeScanner.scanThemes().then((defs)=> {
   themeDefs = defs;
});

function startMainWindow() {
    mainWindow = new BrowserWindow({
        backgroundColor: '#1A242D',
        width: 1570,
        height: 800,
        center: true,
        title: app.getName(),
        minWidth: 1280,
        minHeight: 800,
        icon: path.dirname(ABS_PATH) + '/kongdash-256x256.png',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    mainWindow
        .loadFile(path.join(ABS_PATH, 'workbench', 'bootstrap.html'))
        .then(() => {
            //* Debugging
            mainWindow.webContents.openDevTools();
            //*/
        })
        .catch((err) => {
            console.error('Main error ' + err);
        });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.setName(APP_NAME);

app.on('ready', () => {
    startMainWindow();
});

app.on('activate', () => {
    if (mainWindow === null) startMainWindow();
});

app.on('browser-window-created', (e, window) => {
    let menuTemplate = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Settings',
                    click: () => {
                        mainWindow.webContents.send('workbench:AsyncEventPush', 'Open-Settings-View');
                    }
                },
                {type: 'separator'},
                {role: 'quit'}
            ]
        },
        {
            label: 'Edit',
            submenu: [
                {role: 'undo'},
                {role: 'redo'},
                {type: 'separator'},
                {role: 'cut'},
                {role: 'copy'},
                {role: 'paste'}
            ]
        },
        {
            label: 'Window',
            submenu: [{role: 'togglefullscreen'}]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'GitHub Repository',
                    click: () => {
                        electron.shell.openExternal('https://github.com/ajaysreedhar/KongDash').catch((err) => {
                            console.error(`Help menu error ${err}`);
                        });
                    }
                },
                {
                    label: 'Report Issues',
                    click: () => {
                        electron.shell.openExternal('https://github.com/ajaysreedhar/KongDash/issues').catch((err) => {
                            console.error(`Help menu error ${err}`);
                        });
                    }
                },
                {
                    type: 'separator'
                },
                {
                    label: 'About KongDash',
                    click: () => {
                        electron.shell.openExternal('https://ajaysreedhar.github.io/KongDash/').catch((err) => {
                            console.error(`Help menu error ${err}`);
                        });
                    }
                }
            ]
        }
    ];

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

app.on('will-quit', () => {
    configManager.saveState();
    ipcMain.removeAllListeners();
});

ipcMain.on('workbench:AsyncRequest', (event, action, payload) => {
    if (action === 'Write-Connection') {
        try {
            const connection = configManager.writeConnection(payload);
            connectionMap[`window${event.sender.id}`] = connection.id;
            event.reply('workbench:AsyncResponse', 'Write-Connection', connection);
        } catch (error) {
            event.reply('workbench:AsyncError', 'Write-Connection', {message: `${error}`});
        }
    } else if (action === 'Destroy-Session') {
        if (typeof connectionMap[`window${event.sender.id}`] !== 'undefined') {
            delete connectionMap[`window${event.sender.id}`];
            configManager.removeDefaultConnection();
        }

        mainWindow.loadFile(path.join(ABS_PATH, 'workbench', 'bootstrap.html')).catch((error) => {
            console.error(`${error}`);
        });
    } else if (action === 'Update-Theme') {
        const resolver = themeScanner.readStyle(payload.nonce);

        resolver.then((styles) => {
            event.reply('workbench:AsyncResponse', action, styles);
        });

        resolver.catch((error) => {
            console.error(error);
            event.reply('workbench:AsyncError', action, {message: `${error}`});
        });

    } else {
        event.reply('workbench:AsyncError', {message: `Unknown action ${action}`});
    }
});

ipcMain.on('workbench:SyncQuery', (event, type) => {
    switch (type) {
        case 'Read-All-Connections':
            event.returnValue = sanitize(configManager.getAllConnections());
            break;

        case 'Read-Default-Connection':
            event.returnValue = sanitize(configManager.getDefaultConnection());
            break;

        case 'Read-Session-Connection':
            event.returnValue = sanitize(configManager.getConnectionById(connectionMap[`window${event.sender.id}`]));
            break;

        case 'Read-Theme-Defs':
            event.returnValue = themeDefs;
            break;

        default:
            event.returnValue = {error: `Unknown query type ${type}.`, code: 'E400'};
            break;
    }
});

ipcMain.on('open-external', (event, arg) => {
    electron.shell.openExternal(arg);
});
