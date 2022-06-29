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

const CURRENT_CONFIG = {
    gateway: {...BASE_CONFIG.gateway},
    workbench: {...BASE_CONFIG.workbench}
};

class ConfigManager {
    _write(name) {
        const config = JSON.stringify(CURRENT_CONFIG[name], null, 4);
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

        for (let name in CURRENT_CONFIG) {
            if (!fs.existsSync(`${this._location}/${name}.json`)) {
                continue;
            }

            let loaded = require(`${this._location}/${name}.json`);

            for (let key of Object.keys(CURRENT_CONFIG[name])) {
                if (typeof loaded[key] !== 'undefined') {
                    CURRENT_CONFIG[name][key] = loaded[key];
                }
            }
        }
    }

    getAllConnections() {
        return CURRENT_CONFIG.gateway.connections;
    }

    getDefaultConnection() {
        if (CURRENT_CONFIG.gateway.defaultHost.length === 0) return null;

        const defaultHost = CURRENT_CONFIG.gateway.defaultHost;
        if (typeof CURRENT_CONFIG.gateway.connections[defaultHost] === 'undefined') return null;

        return CURRENT_CONFIG.gateway.connections[defaultHost];
    }

    removeDefaultConnection() {
        this._shouldSave = true;
        CURRENT_CONFIG.gateway.defaultHost = '';
    }

    getConnectionById(id) {
        if (typeof CURRENT_CONFIG.gateway.connections[id] === 'undefined') return null;

        return CURRENT_CONFIG.gateway.connections[id];
    }

    writeConnection(connection) {
        if (typeof connection.id !== 'string' || connection.id.length <= 15) {
            connection.id = crypto.randomBytes(8).toString('hex');
        }

        if (connection.isRemoved === true) {
            const config = CURRENT_CONFIG.gateway.connections[connection.id];
            config.isRemoved = true;

            if (connection.id === CURRENT_CONFIG.gateway.defaultHost) {
                CURRENT_CONFIG.gateway.defaultHost = '';
            }

            delete CURRENT_CONFIG.gateway.connections[connection.id];
            return config;
        }

        const base =
            typeof BASE_CONFIG.gateway.connections[connection.id] === 'object' ? BASE_CONFIG.gateway.connections : {};
        const config = {...base, ...connection};

        CURRENT_CONFIG.gateway.connections[connection.id] = config;

        if (config.isDefault === true) {
            CURRENT_CONFIG.gateway.defaultHost = config.id;
        }

        delete config.isDefault;
        this._shouldSave = true;

        return config;
    }

    getWorkbenchConfig() {
        return CURRENT_CONFIG.workbench;
    }

    writeWorkbenchConfig(config) {
        const fieldList = Object.keys(config);

        for (let field of fieldList) {
            if (config[field] !== null) {
                CURRENT_CONFIG.workbench[field] = config[field];
            }
        }

        this._shouldSave = true;
        return CURRENT_CONFIG.workbench;
    }

    saveState() {
        if (this._shouldSave === false) {
            return this._shouldSave;
        }

        for (let type in CURRENT_CONFIG) {
            this._write(type);
        }

        return this._shouldSave;
    }
}

module.exports = ConfigManager;
