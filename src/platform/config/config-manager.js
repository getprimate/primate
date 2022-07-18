/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const BASE_CONFIG = {
    gateway: require('./gateway-base.js'),
    workbench: require('./workbench-base')
};

class ConfigManager {
    _write(name) {
        const config = JSON.stringify(this._configWrap[name], null, 4);
        fs.writeFileSync(path.join(this._location, `${name}.json`), `${config}\n`, {encoding: 'utf-8', flag: 'w'});
    }

    constructor(location) {
        if (!fs.existsSync(location)) {
            fs.mkdirSync(location, {recursive: true});
        } else {
            const stat = fs.lstatSync(location);

            if (!stat.isDirectory()) throw new Error(`Configuration path ${location} is not a directory.`);
        }

        this._location = location;
        this._shouldSave = false;
        this._configWrap = {
            gateway: {...BASE_CONFIG.gateway},
            workbench: {...BASE_CONFIG.workbench}
        };

        for (let name in this._configWrap) {
            if (!fs.existsSync(`${this._location}/${name}.json`)) {
                continue;
            }

            let loaded = require(`${this._location}/${name}.json`);

            for (let key of Object.keys(this._configWrap[name])) {
                if (typeof loaded[key] !== 'undefined') {
                    this._configWrap[name][key] = loaded[key];
                }
            }
        }
    }

    getAllConnections() {
        return this._configWrap.gateway.connections;
    }

    getConnectionById(id) {
        const {connections} = this._configWrap.gateway;

        if (connections[id] === 'undefined') {
            return null;
        }

        return connections[id];
    }

    getDefaultConnection() {
        const {defaultHost} = this._configWrap.gateway;

        if (defaultHost.length === 0) {
            return null;
        }

        return this.getConnectionById(defaultHost);
    }

    removeDefaultConnection() {
        this._shouldSave = true;
        this._configWrap.gateway.defaultHost = '';
    }

    writeConnection(connection) {
        const {gateway} = this._configWrap;

        if (typeof connection.id !== 'string' || connection.id.length <= 15) {
            connection.id = crypto.randomBytes(8).toString('hex');
        }

        if (connection.isRemoved === true) {
            const config = gateway.connections[connection.id];
            config.isRemoved = true;

            if (connection.id === gateway.defaultHost) {
                gateway.defaultHost = '';
            }

            delete gateway.connections[connection.id];
            return config;
        }

        const base =
            typeof BASE_CONFIG.gateway.connections[connection.id] === 'object' ? BASE_CONFIG.gateway.connections : {};
        const config = {...base, ...connection};

        gateway.connections[connection.id] = config;

        if (config.isDefault === true) {
            gateway.defaultHost = config.id;
        }

        delete config.isDefault;
        this._shouldSave = true;

        return config;
    }

    getWorkbenchConfig() {
        return this._configWrap.workbench;
    }

    writeWorkbenchConfig(config) {
        const {workbench} = this._configWrap;
        const fieldList = Object.keys(config);

        for (let field of fieldList) {
            if (config[field] !== null) {
                workbench[field] = config[field];
            }
        }

        this._shouldSave = true;
        return workbench;
    }

    saveState() {
        if (this._shouldSave === false) {
            return this._shouldSave;
        }

        for (let type in this._configWrap) {
            this._write(type);
        }

        return this._shouldSave;
    }
}

module.exports = ConfigManager;
