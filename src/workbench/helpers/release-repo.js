/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const repository = 'https://raw.githubusercontent.com/getprimate/release-info/main';

/**
 * Retrieves version information from the repository.
 *
 * This function should not be called directly.
 * Allways create a bound function with the below context:
 *
 * @property {RESTClientFactory} _restClient - The rest client factory.
 *
 * @param {string} version - The version text.
 * @returns {Object} Ther retrieved version information.
 */
export async function FetchReleaseInfo(version) {
    const options = {method: 'GET', headers: {}, url: `${repository}/index.json`};
    const {data: releaseIndex} = await this._restClient.request(options);

    if (version === 'latest') {
        options.url = `${repository}/versions/v${releaseIndex.latest.stable}.json`;
        //
    } else if (version === 'current') {
        const current = appBridge.getVersion();
        options.url = `${repository}/versions/v${current}.json`;
        //
    } else {
        options.url = `${repository}/versions/v${version}.json`;
    }

    const {data: releaseInfo} = await this._restClient.request(options);
    return {releaseIndex, releaseInfo};
}
