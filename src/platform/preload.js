'use strict';

const {contextBridge} = require('electron');
const {ipcBridge} = require('./ipc/ipc-bridge');

contextBridge.exposeInMainWorld('ipcBridge', ipcBridge);
