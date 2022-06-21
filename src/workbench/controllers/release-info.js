/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import {FetchReleaseInfo} from '../helpers/release-repo.js';
import releaseModel from '../models/release-model.js';

const {document, appBridge} = window;

/**
 * Provides a generic controller constructor for release information.
 *
 * @constructor
 * @param {Object} scope - Injected scope object.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 */
export default function ReleaseInfoController(scope, routeParams, restClient, viewFrame, toast) {
    scope.appVersion = appBridge.getVersion();

    const fetchReleaseInfo = FetchReleaseInfo.bind({_restClient: restClient});
    const request = fetchReleaseInfo(routeParams.version);

    request.then((release) => {
        scope.releaseModel = release;
    });

    request.catch((error) => {
        toast.error('Unable to fetch release information.');
    });

    switch (routeParams.version) {
        case 'current':
            scope.releaseModel = releaseModel;
            viewFrame.setTitle(`Primate v${scope.appVersion} - Release Notes`);
            break;

        default:
            break;
    }
}
