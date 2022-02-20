/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

/**
 * @callback IPCServerCallback
 * @param {Object} event - The event details.
 * @param {string} event.senderId - The sender Id.
 * @param {Object} payload - The event data payload.
 */

const util = require('util');
const {ipcMain} = require('electron');

const registeredHandlers = {};

function sanitize(payload) {
    if (payload === null || typeof payload === 'undefined') {
        return {error: 'Requested entity is not available.', code: 'E404'};
    }

    return payload;
}

/**
 *
 * @param {Electron.IpcMainEvent} event - The IPC message event.
 * @param {string} channel - The channel name.
 * @param {string} action - The action name.
 * @param {Object} payload - Data from the renderer.
 */
function respond(event, channel, action, payload) {
    switch (channel) {
        case 'workbench:AsyncRequest':
            event.reply('workbench:AsyncResponse', action, payload);
            return true;

        case 'workbench:SyncQuery':
            event.returnValue = sanitize(payload);
            return true;
    }

    return false;
}

/**
 *
 * @param {Electron.IpcMainEvent} event - The IPC message event.
 * @param {string} action - The action name.
 * @param {Object} payload - Data from the renderer.
 */
function handlerWrapper(event, action, payload) {
    if (typeof this._channelName !== 'string') {
        this._channelName = '__none__';
    }

    const handlers = registeredHandlers[this._channelName];

    if (typeof handlers !== 'object' || typeof handlers[action] !== 'function') {
        return false;
    }

    if (util.types.isAsyncFunction(handlers[action])) {
        const resolver = handlers[action].call(null, {senderId: event.sender.id}, payload);

        resolver.then((payload) => {
            return respond(event, this._channelName, action, payload);
        });

        resolver.catch((error) => {
            return respond(event, this._channelName, action, {error});
        });

        return true;
    }

    try {
        const returnValue = handlers[action].call(null, payload);
        respond(event, this._channelName, action, returnValue);
    } catch (error) {
        respond(event, this._channelName, action, {error});
    }

    return true;
}

/**
 * Registers a callback function to handle requests or queries.
 *
 * @param {string} channel - The channel name.
 * @param {string} action - The action name.
 * @param {IPCServerCallback} handler - The callback function to handle the requests and queries.
 * @return {boolean}
 */
function registerHandler(channel, action, handler) {
    if (typeof registeredHandlers[channel] === 'undefined') {
        registeredHandlers[channel] = {};
        ipcMain.on(channel, handlerWrapper.bind({_channelName: channel}));
    }

    if (typeof registeredHandlers[channel][action] !== 'function') {
        registeredHandlers[channel][action] = handler;
    }

    return true;
}

/**
 * THe object to be attached to the context.
 */
const ipcServer = {
    /**
     * Registers an event handler for handling asynchronous requests.
     *
     * @param {(
     *      'Write-Connection' |
     *      'Destroy-Session' |
     *      'Update-Theme'
     * )} action - The request action name.
     * @param {IPCServerCallback} handler - A callback function to handle the requests.
     * @return {boolean} True if registered, false otherwise.
     */
    registerRequestHandler(action, handler) {
        return registerHandler('workbench:AsyncRequest', action, handler);
    },

    /**
     * Registers an event handler for handling synchronous queries.
     *
     * @param {(
     *      'Read-All-Connections' |
     *      'Read-Default-Connection' |
     *      'Read-Session-Connection' |
     *      'Read-Workbench-Config' |
     *      'Read-Theme-Defs'
     * )} type - The query type.
     * @param {IPCServerCallback} handler - A callback function to handle the queries.
     * @return {boolean} True if registered, false otherwise.
     */
    registerQueryHandler(type, handler) {
        return registerHandler('workbench:SyncQuery', type, handler);
    },

    /**
     * Removes listeners from specified channels.
     *
     * If channel name is not specified, all registered listeners will be removed.
     *
     * @param {string[]|null} channels - The channel names or null.
     */
    removeListeners(channels = null) {
        const chList = Array.isArray(channels) ? channels : Object.keys(registeredHandlers);

        for (let channel of chList) {
            ipcMain.removeAllListeners(channel);

            let current = registeredHandlers[channel];
            let actions = Object.keys(current);

            for (let action of actions) {
                current[action].splice(0);
            }

            registeredHandlers[channel] = null;
            delete registeredHandlers[channel];
        }
    }
};

module.exports = {ipcServer};
