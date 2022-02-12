/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

export default {
    keyAuth: {
        key: '',
        ttl: 0,
        tags: []
    },
    basicAuth: {
        username: '',
        password: '',
        tags: []
    },
    oauth2: {
        name: '',
        client_id: '',
        client_secret: '',
        client_type: '',
        hash_secret: '',
        redirect_uris: [],
        tags: []
    },
    hmacAuth: {
        username: '',
        secret: '',
        tags: []
    },
    jwt: {
        algorithm: 'HS256',
        key: '',
        rsa_public_key: '',
        secret: '',
        tags: []
    },
    acls: {
        group: '',
        tags: []
    }
};
