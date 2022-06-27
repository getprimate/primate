/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const {document} = window;

/**
 * Provides a generic controller constructor for welcome screens.
 *
 * @constructor
 * @param {Object} scope - Injected scope object.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 */
export default function WelcomeIntroController(scope, location, viewFrame) {
    scope.showSetupView = function () {
        document
            .getElementById('sidebarMenu')
            .querySelector('ul.navigation__menu li:nth-child(2) a.navigation__link')
            .click();

        return true;
    };

    switch (location.path()) {
        case '/welcome':
            viewFrame.setTitle('Welcome');
            break;

        default:
            break;
    }
}
