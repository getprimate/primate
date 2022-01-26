'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

        for (let name in CURRENT_CONFIG) {
            if (fs.existsSync(`${this._location}/${name}.json`)) {
                CURRENT_CONFIG[name] = require(`${this._location}/${name}.json`);
            }
        }
    }

    getDefaultConnection() {
        if (CURRENT_CONFIG.gateway.defaultHost.length === 0) return null;

        const defaultHost = CURRENT_CONFIG.gateway.defaultHost;
        if (typeof CURRENT_CONFIG.gateway.connections[defaultHost] === 'undefined') return null;

        return CURRENT_CONFIG.gateway.connections[defaultHost];
    }

    removeDefaultConnection() {
        CURRENT_CONFIG.gateway.defaultHost = '';
    }

    getConnectionById(id) {
        if (typeof CURRENT_CONFIG.gateway.connections[id] === 'undefined') return null;

        return CURRENT_CONFIG.gateway.connections[id];
    }

    writeConnection(connection) {
        if (typeof connection.id !== 'string' || connection.id.length === 0) {
            connection.id = crypto.randomBytes(8).toString('hex');
        }

        const base =
            typeof BASE_CONFIG.gateway.connections[connection.id] === 'object' ? BASE_CONFIG.gateway.connections : {};
        const config = {...base, ...connection};

        CURRENT_CONFIG.gateway.connections[connection.id] = config;

        if (config.isDefault === true) {
            CURRENT_CONFIG.gateway.defaultHost = config.id;
        }

        return config;
    }

    saveState() {
        for (let type in CURRENT_CONFIG) {
            this._write(type);
        }
    }
}

module.exports = ConfigManager;
