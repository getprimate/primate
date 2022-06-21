'use strict';

const {contextBridge} = require('electron');
const {ipcBridge} = require('./ipc/ipc-bridge');

const appBridge = {
    getVersion() {
        return '1.0.0';
    }
};

contextBridge.exposeInMainWorld('appBridge', appBridge);
contextBridge.exposeInMainWorld('ipcBridge', ipcBridge);
