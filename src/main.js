const electron = require('electron')
const path = require('path')
const pathExtra = require('path-extra')
const jsonfile = require('jsonfile')

var absPath = path.dirname(`${__dirname}`),
    configFile = pathExtra.datadir('KongDash') + '/config.json'

var {app, ipcMain, BrowserWindow, Menu} = electron

app.setName('KongDash')

let mainWindow, globalConfig = { kong: {}, app: { enableAnimation: true } }

function startMainWindow () {
    mainWindow = new BrowserWindow({
        backgroundColor: '#1A242D',
        width: 1100,
        height: 580,
        center: true,
        title: app.getName(),
        minHeight: 500,
        minWidth: 900,
	    icon: absPath + '/kongdash-icon.png'
    })
    mainWindow.loadURL('file://' + absPath + '/src/init.html')

    //* Debugging
    mainWindow.webContents.openDevTools();
    //*/

    mainWindow.on('closed', () => {
        mainWindow = null
    })
}

app.on('ready', () => {
    try {
        var config = jsonfile.readFileSync(configFile)
        globalConfig = config

    } catch (ignored) {

    } finally {
        startMainWindow()
    }
})

app.on('activate', () => {
    if (mainWindow === null)
        startMainWindow()
})

app.on('browser-window-created', (e, window) => {
    var menuTemplate = [{
        label: 'File',
        submenu: [{ role: 'quit' }]
    }, {
        label: 'Edit',
        submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }]
    }, {
        label: 'Window',
        submenu: [{
            label: 'Reload',
            accelerator: 'CmdOrCtrl+R',
            click: (item, focusedWindow) => {
                if (focusedWindow)
                    focusedWindow.reload()
            }
        }, {role: 'togglefullscreen'}]
    }, {
        label: 'Help',
        submenu: [{
            label: 'GitHub Repository',
            click: () => {
                electron.shell.openExternal('https://github.com/ajaysreedhar/kongdash')
            }
        }, {
            label: 'Report Issues',
            click: () => {
                electron.shell.openExternal('https://github.com/ajaysreedhar/kongdash/issues')
            }
        }, {
           type: 'separator'
        }, {
            label: 'About KongDash',
            click: () => {
                electron.shell.openExternal('http:ajaysreedhar.github.io/kongdash')
            }
        }]
    }]

    window.setMenu(Menu.buildFromTemplate(menuTemplate))
})

app.on('window-all-closed', () => {
    if(process.platform !== 'darwin')
        app.quit()
});

ipcMain.on('get-kong-config', (event) => {
    event.returnValue = globalConfig.kong
})

ipcMain.on('get-app-config', (event) => {
    event.returnValue = globalConfig.app
})

ipcMain.on('write-kong-config', (event, arg) => {
    globalConfig.kong = arg;

    jsonfile.writeFile(configFile, globalConfig, function (error) {
        if (error) {
            event.sender.send('write-config-error', {message: 'Could not write configuration file'})
        } else {
            event.sender.send('write-config-success', {})
        }
    })
})

ipcMain.on('write-app-config', (event, arg) => {
    globalConfig.app = arg;

    jsonfile.writeFile(configFile, globalConfig, function (error) {
        if (error) {
            event.sender.send('write-config-error', {message: 'Could not write configuration file'})
        } else {
            event.sender.send('write-config-success', {})
        }
    })
})
