/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import _ from '../../lib/core-utils.js';
import {urlQuery, urlOffset} from '../../lib/rest-utils.js';

/**
 * Provides controller constructor for editing certificate objects.
 *
 * @constructor
 * @param {Object} scope - Injected scope object.
 * @param {Object} location - Injected Angular location service.
 * @param {function} location.path - Tells the current view path.
 * @param {{
 *     upstreamId: string,
 *     certId: string
 * }} routeParams - Object containing route parameters.
 * @param {RESTClientFactory} restClient - Customised HTTP REST client factory.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 * @param {ToastFactory} toast - Factory for displaying notifications.
 */
export default function CertificateEditController(scope, location, routeParams, restClient, viewFrame, toast) {
    const restConfig = {method: 'POST', endpoint: '/certificates'};

    scope.certId = '__none__';
    scope.certModel = {cert: '', key: '', cert_alt: '', key_alt: '', tags: '', snis: ''};

    scope.sniModel = {shorthand: ''};
    scope.sniList = [];
    scope.sniNext = {offset: ''};

    scope.upstreamList = [];
    scope.upstreamNext = {offset: ''};

    /**
     * Retrieves the SNIs associated with the current certificate.
     *
     * @param {string|object|null} filters - Filters to the Admin API endpoint.
     * @return boolean - True if request could be made, false otherwise
     */
    scope.fetchSniList = (filters = null) => {
        const request = restClient.get(`/certificates/${scope.certId}/snis` + urlQuery(filters));

        request.then(({data: response}) => {
            scope.sniNext.offset = urlOffset(response.next);

            for (let sni of response.data) {
                sni.tags = sni.tags.length >= 1 ? sni.tags.join(', ') : 'No tags added.';

                scope.sniList.push(sni);
            }
        });

        request.catch(() => {
            toast.error('Could not load SNIs.');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });

        return true;
    };

    /**
     * Retrieves the upstreams which uses the current certificate.
     *
     * @param {string|object|null} filters - Filters to the Admin API endpoint.
     * @return boolean - True if request could be made, false otherwise
     */
    scope.fetchUpstreamList = (filters = null) => {
        const request = restClient.get(`/certificates/${scope.certId}/upstreams` + urlQuery(filters));

        request.then(({data: response}) => {
            scope.upstreamNext = urlOffset(response.next);

            for (let upstream of response.data) {
                scope.upstreamList.push(upstream);
            }
        });

        request.catch(() => {
            toast.error('Could not load upstreams.');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });
    };

    /**
     * Builds certificate object from the model and submits the form.
     *
     * @param {Event} event - The current event object.
     * @returns {boolean} False always.
     */
    scope.submitCertificateForm = function (event) {
        event.preventDefault();

        if (scope.certModel.cert.length <= 10) {
            toast.error('Please paste a valid certificate.');
            return false;
        }

        if (scope.certModel.key.length <= 10) {
            toast.error('Please paste a valid key for the certificate.');
            return false;
        }

        const payload = _.deepClone(scope.certModel);

        if (scope.certModel.tags.length > 0) {
            payload.tags = _.explode(scope.certModel.tags);
        }

        if (restConfig.method === 'PATCH') {
            delete payload.snis;
        } else {
            payload.snis = _.explode(scope.certModel.snis);
        }

        if (scope.certModel.cert_alt.length <= 0 || scope.certModel.key_alt.length <= 0) {
            delete payload.cert_alt;
            delete payload.key_alt;
        }

        const request = restClient.request({method: restConfig.method, resource: restConfig.endpoint, data: payload});

        request.then(({data: response}) => {
            switch (scope.certId) {
                case '__none__':
                    toast.success('New certificate added');
                    window.location.href = '#!' + location.path().replace('/__create__', `/${response.id}`);
                    break;

                default:
                    toast.info('Certificate details updated');
            }
        });

        request.catch(({data: response}) => {
            toast.error(response.data);
        });

        return false;
    };

    /**
     * Builds SNI object from the model and submits the form.
     *
     * @param {Event} event - The current event object.
     * @returns {boolean} False always.
     */
    scope.submitSNIForm = function (event) {
        event.preventDefault();

        const exploded = _.explode(scope.sniModel.shorthand);

        if (exploded.length <= 0) {
            return false;
        }

        const payload = {name: exploded[0], certificate: {id: scope.certId}, tags: []};

        for (let index = 1; index < exploded.length; index++) {
            payload.tags.push(exploded[index]);
        }

        const request = restClient.post(`/certificates/${scope.certId}/snis`, payload);

        request.then(({data: response}) => {
            response.tags = response.tags.length >= 1 ? response.tags.join(', ') : 'No tags added.';

            scope.sniList.push(response);
            toast.success(`Added new SNI ${response.name}`);
        });

        request.catch(({status, data: error}) => {
            toast.error(status === 409 ? 'SNI already added to this certificate' : error);
        });

        request.finally(() => {
            scope.sniModel.shorthand = '';
        });

        return false;
    };

    if (typeof routeParams.upstreamId === 'string') {
        restConfig.endpoint = `/upstreams/${routeParams.upstreamId}/client_certificate`;
    } else {
        viewFrame.clearBreadcrumbs();
    }

    viewFrame.addBreadcrumb('#!/certificates', 'Certificates');

    switch (routeParams.certId) {
        case '__create__':
            viewFrame.setTitle('Add Certificate');
            viewFrame.addBreadcrumb(location.path(), 'Create +');
            break;

        default:
            restConfig.method = 'PATCH';
            restConfig.endpoint = `${restConfig.endpoint}/${routeParams.certId}`;

            scope.certId = routeParams.certId;

            viewFrame.setTitle('Edit Certificate');
            break;
    }

    if (restConfig.method === 'PATCH' && scope.certId !== '__none__') {
        const request = restClient.get(restConfig.endpoint);

        viewFrame.setLoaderSteps(3);

        request.then(({data: response}) => {
            for (let key of Object.keys(response)) {
                if (typeof scope.certModel[key] === 'undefined') {
                    continue;
                }

                if (response[key] === null) {
                    scope.certModel[key] = '';
                    continue;
                }

                scope.certModel[key] = Array.isArray(response[key]) ? response[key].join(', ') : response[key];
            }

            viewFrame.addAction(
                'Delete',
                '#!/certificates',
                'btn critical delete',
                'certificate',
                `/certificates/${scope.certId}`
            );

            viewFrame.addBreadcrumb(location.path(), _.objectName(response.id));
        });

        request.catch(() => {
            toast.error('Could not load certificate details');
            window.location.href = '#!/certificates';
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });

        scope.fetchSniList();
        scope.fetchUpstreamList();
    }
}
