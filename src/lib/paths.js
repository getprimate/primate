/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

function _offset(location) {
    const url = new URL(location);
    const params = url.searchParams;

    return params.get('offset');
}

export default {
    offset: _offset
};
