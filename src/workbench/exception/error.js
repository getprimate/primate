/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const errorCode = {
    INVALID_HOST: 'E101',
    UNTRUSTED_SSL: 'E102'
};

export {errorCode as errorCode};

export class WorkbenchError extends Error {
    constructor(message, code = 'E000') {
        super(message);

        this._code = code;
    }

    getMessage() {
        return this.message;
    }

    getCode() {
        return this._code;
    }
}
