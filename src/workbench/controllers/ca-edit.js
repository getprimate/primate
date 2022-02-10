/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import {deepClone, isNil} from '../../lib/core-toolkit.js';
import {editViewURL, simplifyObjectId} from '../helpers/rest-toolkit.js';
import caModel from '../models/ca-model.js';

function refreshCAModel(model, source) {
    const keys = Object.keys(source);

    for (let key of keys) {
        if (isNil(model[key]) || isNil(source[key])) continue;

        model[key] = source[key];
    }

    return model;
}

/**
 * Provides controller constructor for editing CA certificates.
 *
 * @constructor
 * @param {Object} scope - Injected scope object.
 * @param {Object} location - Injected Angular location service.
 * @param {function} location.path - Tells the current view path.
 * @param {{
 *     caId: string
 * }} routeParams - Object containing route parameters.
 * @param {RESTClientFactory} restClient - Customised HTTP REST client factory.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 * @param {ToastFactory} toast - Factory for displaying notifications.
 */
export default function TrustedCAEditController(scope, location, routeParams, restClient, viewFrame, toast) {
    const restConfig = {method: 'POST', endpoint: '/ca_certificates'};
    const eventLocks = {submitCAForm: false};

    scope.caId = '__none__';
    scope.caModel = deepClone(caModel);

    /**
     * Builds CA certificate object from the model and submits the form.
     *
     * @param {Event} event - The current event object.
     * @returns {boolean} True if the request could be made. false otherwise.
     */
    scope.submitCAForm = function (event) {
        event.preventDefault();

        if (eventLocks.submitCAForm === true) return false;

        if (scope.caModel.cert.length <= 10) {
            toast.error('Please paste a valid certificate body.');
            return false;
        }

        eventLocks.submitCAForm = true;
        viewFrame.setLoaderSteps(1);

        const payload = deepClone(scope.caModel);

        if (scope.caModel.cert_digest.length <= 10) delete payload.cert_digest;

        const request = restClient.request({method: restConfig.method, endpoint: restConfig.endpoint, payload});

        request.then(({data: response}) => {
            toast.success('CA details saved successfully.');

            if (scope.caId === '__none__') window.location.href = editViewURL(location.path(), response.id);
        });

        request.catch(() => {
            toast.error('Unable to save CA details.');
        });

        request.finally(() => {
            eventLocks.submitCAForm = false;
            viewFrame.incrementLoader();
        });

        return true;
    };

    /**
     * Resets CA details form if the user confirms the prompt.
     *
     * @param {Event} event - The current event object.
     * @returns {boolean} True if form has been reset, false otherwise.
     */
    scope.resetCAForm = function (event) {
        event.preventDefault();

        if (eventLocks.submitCAForm === true) return false;

        const proceed = confirm('Proceed to clear the form?');
        if (proceed) scope.caModel = deepClone(caModel);

        return proceed;
    };

    switch (routeParams.caId) {
        case '__create__':
            viewFrame.setTitle('Add CA Certificate');
            viewFrame.addBreadcrumb(location.path(), 'Create +');
            break;

        default:
            restConfig.method = 'PATCH';
            restConfig.endpoint = `${restConfig.endpoint}/${routeParams.caId}`;

            scope.caId = routeParams.caId;

            viewFrame.clearBreadcrumbs();
            viewFrame.addBreadcrumb('#!/certificates', 'Certificates');
            viewFrame.setTitle('Edit CA Certificate');
            break;
    }

    /* Load the CA certificate details if a valid certificate id is provided. */
    if (restConfig.method === 'PATCH' && scope.caId !== '__none__') {
        const request = restClient.get(restConfig.endpoint);

        viewFrame.setLoaderSteps(1);

        request.then(({data: response}) => {
            refreshCAModel(scope.caModel, response);

            viewFrame.addAction(
                'Delete',
                '#!/certificates',
                'btn critical delete',
                'CA certificate',
                `/ca_certificates/${scope.caId}`
            );

            viewFrame.addBreadcrumb(location.path(), simplifyObjectId(response.id));
        });

        request.catch(() => {
            toast.error('Unable to fetch CA details.');
            window.location.href = '#!/certificates';
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });
    }
}
