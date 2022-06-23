/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import {greaterThan} from '../lib/version-utils.js';
import {FetchReleaseInfo} from '../helpers/release-repo.js';

const {document, appBridge} = window;

/**
 * Provides controller constructor for footer view.
 *
 * @constructor
 * @param {Object} scope - injected scope object
 * @param {function} http - angular http provider
 * @param {ViewFrameFactory} viewFrame - custom view frame factory
 * @param {ToastFactory} toast - custom toast message service
 * @param {LoggerFactory} logger - custom logger factory
 */
export default function FooterController(scope, restClient, viewFrame, toast, logger) {
    const {document} = window;

    const footerMain = document.getElementById('mainFooter');
    const fetchReleaseInfo = FetchReleaseInfo.bind({_restClient: restClient});

    scope.appVersion = window.appBridge.getVersion();
    scope.frameState = viewFrame.getState();
    scope.frameConfig = viewFrame.getFrameConfig();

    scope.eventLogs = logger.getCache();

    scope.toggleActivityLog = function (event) {
        const {target} = event;

        if (target.checked === true) {
            logger.resume();

            footerMain.classList.add('maximized');
            document.getElementById('mainLayout').classList.add('resized');
        } else {
            logger.pause();
            logger.clear();

            footerMain.classList.remove('maximized');
            document.getElementById('mainLayout').classList.remove('resized');
        }
    };

    const release = fetchReleaseInfo('latest');

    release.then(({releaseIndex}) => {
        if (!greaterThan(releaseIndex.latest.stable, appBridge.getVersion())) {
            return false;
        }

        const baseMenu = document.getElementById('index__ftBase').firstElementChild;
        const anchor = document.createElement('a');

        anchor.href = '#!/release-info/latest';
        anchor.innerHTML = '<span class="material-icons">browser_updated</span>&nbsp;Update Available';

        baseMenu.firstElementChild.appendChild(anchor);

        anchor.addEventListener('click', (event) => {
            event.currentTarget.remove();
        });

        return true;
    });

    release.catch(() => {
        /* Simply ignore the error. */
    });
}
