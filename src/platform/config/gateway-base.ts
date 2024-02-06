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

export interface ConnectionProps {
    id: string;
    name: string;
    protocol: string;
    adminHost: string;
    colorCode: string;
    authMethod: string;
    createdAt: number;
    basicAuth?: {
        credentials: string;
    };
    isRemoved?: boolean;
    isDefault?: boolean;
}

export interface GatewayBase {
    defaultHost: string;
    connections: Record<string, ConnectionProps>;
}

const base: GatewayBase = {
    defaultHost: "",
    connections: {}
};

export default base;
