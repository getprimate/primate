'use strict';

const {ipcRenderer, contextBridge} = require('electron');

const registeredListeners = {};

function handleIPCMessages(event, action, payload) {
    if (typeof this._channelName !== 'string') {
        this._channelName = '__none__';
    }

    console.log('Calling callback for ', this._channelName, action);

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
            console.log('Registering for ', channel, ' ', action, ' ', typeof listener);

            registeredListeners[channel] = {};
            ipcRenderer.on(channel, handleIPCMessages.bind({_channelName: channel}));
        }

        if (Array.isArray(registeredListeners[channel][action])) {
            console.log('Need to create new action', action);
            registeredListeners[channel][action].push(listener);
            return true;
        }

        console.log('Action already exist for ', channel, ' ', action);
        registeredListeners[channel][action] = [listener];

        console.log('Full: ', JSON.stringify(registeredListeners, null, 4));
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

            console.log('Remove registers for', channel);
            delete registeredListeners[channel];
        }
    }
};

contextBridge.exposeInMainWorld('ipcHandler', ipcHandler);
