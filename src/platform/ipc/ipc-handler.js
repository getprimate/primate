/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

/**
 * @callback IPCEventCallback
 * @param {Object} payload - The event data payload.
 */

/**
 * The IPC Handler helper to be exposed using {@link Electron.contextBridge contextBridge}.
 *
 * @typedef {Object} IPCHandler
 * @property {(function(
 *      action: string,
 *      listener: IPCEventCallback): boolean
 *      )} onEventPush - Registers an event listener to handle asynchronous push events from main process.
 * @property {(function(
 *      action: string,
 *      listener: IPCEventCallback): boolean
 *      )} onRequestDone - Registers an event listener to handle successful event responses.
 * @property {(function(
 *      action: string,
 *      listener: IPCEventCallback): boolean
 *      )} onRequestFail - Registers an event listener to handle failed event responses.
 * @property {(function(action: string, payload: any=): void)} sendRequest - Sends an event to the asynchronous event channel.
 * @property {(function(resource: string, payload: any=): any)} sendQuery - Sends an event to the synchronous event channel.
 * @property {(function(channel: string[]=): void)} removeListeners - Cleans up the existing event listeners.
 * @property {(function(channel: string, action: string): void)} removeCallbacks - Removes listeners for a particular action.
 */

const {ipcRenderer} = require('electron');

const registeredCallbacks = {};

function callbackWrapper(event, action, payload) {
    if (typeof this._channelName !== 'string') {
        this._channelName = '__none__';
    }

    if (typeof registeredCallbacks[this._channelName] === 'object') {
        for (let callback of registeredCallbacks[this._channelName][action]) {
            callback.call({}, payload);
        }
    }
}

function registerCallback(channel, action, listener) {
    if (typeof registeredCallbacks[channel] === 'undefined') {
        registeredCallbacks[channel] = {};
        ipcRenderer.on(channel, callbackWrapper.bind({_channelName: channel}));
    }

    if (Array.isArray(registeredCallbacks[channel][action])) {
        registeredCallbacks[channel][action].push(listener);
        return true;
    }

    registeredCallbacks[channel][action] = [listener];
    return true;
}

/**
 * THe object to be attached to the context.
 *
 * @type {IPCHandler}
 */
const ipcHandler = {
    onEventPush(action, listener) {
        return registerCallback('workbench:AsyncEventPush', action, listener);
    },

    onRequestDone(action, listener) {
        return registerCallback('workbench:AsyncResponse', action, listener);
    },

    onRequestFail(action, listener) {
        return registerCallback('workbench:AsyncError', action, listener);
    },

    sendRequest(action, payload = {}) {
        ipcRenderer.send('workbench:AsyncRequest', action, payload);
    },

    sendQuery(resource, payload = {}) {
        return ipcRenderer.sendSync('workbench:SyncQuery', resource, payload);
    },

    removeListeners(channels = null) {
        const chList = Array.isArray(channels) ? channels : Object.keys(registeredCallbacks);

        for (let channel of chList) {
            ipcRenderer.removeAllListeners(channel);

            let current = registeredCallbacks[channel];
            let actions = Object.keys(current);

            for (let action of actions) {
                current[action].splice(0);
            }

            delete registeredCallbacks[channel];
        }
    },

    removeCallbacks(event, action) {
        let channel = '__none__';

        switch (event) {
            case 'onRequestDone':
                channel = 'workbench:AsyncResponse';
                break;

            default:
                break;
        }

        if (Array.isArray(registeredCallbacks[channel][action])) {
            registeredCallbacks[channel][action].splice(0);
        }
    }
};

module.exports = {ipcHandler};
