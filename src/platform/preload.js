'use strict';

const {contextBridge} = require('electron');
const {ipcHandler} = require('./ipc/ipc-handler');

contextBridge.exposeInMainWorld('ipcHandler', ipcHandler);
