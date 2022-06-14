/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

/**
 * Provides a controller constructor that does not do anything significant.
 *
 * @constructor
 * @param {Object} scope - Injected scope object.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 */
export default function IdleController(scope, location, viewFrame) {
    switch (location.path()) {
        case '/welcome':
            viewFrame.setTitle('Welcome to KongDash');
            break;

        case '/release-note':
            viewFrame.setTitle('Release Notes');
            break;

        default:
            break;
    }
}
