'use strict';

const {ipcRenderer, contextBridge} = require('electron');

const registeredListeners = {};

function handleIPCMessages(event, action, payload) {
    if (typeof this._channelName !== 'string') {
        this._channelName = '__none__';
    }

    if (typeof registeredListeners[this._channelName] === 'object') {
        for (let callback of registeredListeners[this._channelName][action]) {
            callback.apply({}, payload);
        }
    }
}

/**
 *
 * @type {{sendQuery(string, string, any): void, sendMessage(string, string, any): void, registerListener(string, string, any): (boolean|undefined)}}
 */
const ipcHandler = {
    registerListener(channel, action, listener) {
        if (typeof registeredListeners[channel] === 'undefined') {
            registeredListeners[channel] = {};
            ipcRenderer.on(channel, handleIPCMessages.bind({_channelName: channel}));
        }

        if (Array.isArray(registeredListeners[channel][action])) {
            registeredListeners[channel][action].push(listener);
            return true;
        }

        registeredListeners[channel][action] = [listener];
    },

    sendMessage(channel, action, payload) {
        ipcRenderer.send(channel, action, payload);
    },

    sendQuery(action, payload) {
        return ipcRenderer.sendSync('workbench:SyncQuery', action, payload);
    },

    removeListeners() {
        const channels = Object.keys(registeredListeners);

        for (let channel of channels) {
            ipcRenderer.removeAllListeners(channel);

            let current = registeredListeners[channel];
            let actions = Object.keys(current);

            for (let action of actions) {
                current[action].splice(0);
            }

            delete registeredListeners[channel];
        }
    }
};

contextBridge.exposeInMainWorld('ipcHandler', ipcHandler);
