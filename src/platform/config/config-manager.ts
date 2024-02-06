/**
 * ------------------------------------------------------------
 * 
 * Copyright (c) 2022-present Ajay Sreedhar.
 *
 * Licensed under the MIT License.
 * See LICENSE file located in the root directory.
 * 
 * ============================================================
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import gatewayBase, {GatewayBase, ConnectionProps} from "./gateway-base";
import wkbenchBase, {WorkbenchBase} from "./workbench-base";

type ConfigWrap = {gateway: GatewayBase, workbench: WorkbenchBase};

class ConfigManager {

    private _location: string;
    private _shouldSave: boolean;
    private _configWrap: ConfigWrap;

    _write(name: keyof ConfigWrap): void {
        const config = JSON.stringify(this._configWrap[name], null, 4);
        fs.writeFileSync(path.join(this._location, `${name}.json`), `${config}\n`, {encoding: "utf-8", flag: "w"});
    }

    constructor(location: string) {
        if (!fs.existsSync(location)) {
            fs.mkdirSync(location, {recursive: true});
        } else {
            const stat = fs.lstatSync(location);

            if (!stat.isDirectory()) throw new Error(`Configuration path ${location} is not a directory.`);
        }

        this._location = location;
        this._shouldSave = false;

        this._configWrap = {
            gateway: {...gatewayBase},
            workbench: {...wkbenchBase}
        };

        for (const name in this._configWrap) {
            if (!fs.existsSync(`${this._location}/${name}.json`)) {
                continue;
            }

            /* TODO, FIXME - Remove require() usage and use JSON.parse(). */
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const loaded = require(`${this._location}/${name}.json`);

            for (const key of Object.keys(this._configWrap[name as keyof ConfigWrap])) {
                if (typeof loaded[key] !== "undefined") {
                    // @ts-expect-error Iteration over known type.
                    this._configWrap[name][key] = loaded[key];
                }
            }
        }
    }

    getAllConnections(): Record<string, ConnectionProps> {
        return this._configWrap.gateway.connections;
    }

    getConnectionById(id: string): ConnectionProps {
        const {connections} = this._configWrap.gateway;

        if (typeof connections[id] === "undefined") {
            return null;
        }

        return connections[id];
    }

    getDefaultConnection(): ConnectionProps {
        const {defaultHost} = this._configWrap.gateway;

        if (defaultHost.length === 0) {
            return null;
        }

        return this.getConnectionById(defaultHost);
    }

    removeDefaultConnection(): void {
        this._shouldSave = true;
        this._configWrap.gateway.defaultHost = "";
    }

    writeConnection(connection: ConnectionProps): ConnectionProps {
        const {gateway} = this._configWrap;

        if (typeof connection.id !== "string" || connection.id.length <= 15) {
            connection.id = crypto.randomBytes(8).toString("hex");
        }

        if (connection.isRemoved === true) {
            const config = gateway.connections[connection.id];
            config.isRemoved = true;

            if (connection.id === gateway.defaultHost) {
                gateway.defaultHost = "";
            }

            delete gateway.connections[connection.id];
            return config;
        }

        const base = typeof gateway.connections[connection.id] === "object" ? gateway.connections : {};
        const config = {...base, ...connection};

        gateway.connections[connection.id] = config;

        if (config.isDefault === true) {
            gateway.defaultHost = config.id;
        }

        delete config.isDefault;
        this._shouldSave = true;

        return config;
    }

    getWorkbenchConfig(): WorkbenchBase {
        return this._configWrap.workbench;
    }

    writeWorkbenchConfig(config: WorkbenchBase): WorkbenchBase {
        const {workbench} = this._configWrap;
        const fieldList: (keyof WorkbenchBase)[] = Object.keys(config) as (keyof WorkbenchBase)[];

        for (const field of fieldList) {
            if (config[field] === null) {
                continue;
            }

            // @ts-expect-error Iteration over known type.
            workbench[field] = config[field];
        }

        this._shouldSave = true;
        return workbench;
    }

    saveState(): boolean {
        if (this._shouldSave === false) {
            return this._shouldSave;
        }

        for (const type in this._configWrap) {
            this._write(type as keyof ConfigWrap);
        }

        return this._shouldSave;
    }
}

export default ConfigManager;
