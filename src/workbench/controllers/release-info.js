/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import {greaterThan} from '../lib/version-utils.js';
import {epochToDate} from '../helpers/date-lib.js';
import {FetchReleaseInfo} from '../helpers/release-repo.js';
import releaseModel from '../models/release-model.js';

const {appBridge} = window;

/**
 * Provides a generic controller constructor for release information.
 *
 * @constructor
 * @param {Object} scope - Injected scope object.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 */
export default function ReleaseInfoController(scope, routeParams, restClient, viewFrame, toast) {
    scope.installedVersion = appBridge.getVersion();
    scope.upgradedVersion = 'Checking...';

    scope.releaseModel = releaseModel;
    scope.releaseModel.publishedAt = epochToDate(releaseModel.publishedAt, viewFrame.getConfig('dateFormat'));

    const fetchReleaseInfo = FetchReleaseInfo.bind({_restClient: restClient});
    const request = fetchReleaseInfo(routeParams.version);

    request.then(({releaseIndex, releaseInfo}) => {
        if (Array.isArray(releaseIndex.contributors) && Array.isArray(releaseInfo.contributors)) {
            releaseInfo.contributors = releaseIndex.contributors.concat(releaseInfo.contributors);
        }

        releaseInfo.publishedAt = epochToDate(releaseInfo.publishedAt, viewFrame.getConfig('dateFormat'));

        scope.$apply((scope_) => {
            scope_.upgradedVersion = releaseIndex.latest.stable;
            scope_.releaseModel = releaseInfo;

            if (greaterThan(releaseIndex.latest.stable, scope_.installedVersion)) {
                scope_.upgradeLink = 'https://www.getprimate.xyz/download';
            }
        });
    });

    request.catch(() => {
        if (routeParams.version === 'current') toast.error('Internet connection recommended.');
        else toast.error('Unable to fetch release information.');

        scope.upgradedVersion = 'Failed to check.';
    });

    viewFrame.clearBreadcrumbs();
    viewFrame.setTitle(`Release Notes`);
    viewFrame.addBreadcrumb('#!/release-info/current', 'Release Notes');
}
