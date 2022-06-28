/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import * as _ from '../lib/core-toolkit.js';
import {urlQuery, urlOffset, deleteMethodInitiator, simplifyObjectId} from '../helpers/rest-toolkit.js';
import {epochToDate} from '../helpers/date-lib.js';
import certModel from '../models/certificate-model.js';

function refreshCertModel(model, source) {
    const keys = Object.keys(source);

    for (let key of keys) {
        if (typeof model[key] === 'undefined' || _.isNil(source[key])) continue;

        model[key] = source[key];
    }
}

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
    const eventLocks = {submitCertForm: false, submitSNIForm: false};

    scope.certId = '__none__';
    scope.certModel = _.deepClone(certModel);

    scope.sniModel = {shorthand: ''};
    scope.sniList = [];
    scope.sniNext = {offset: ''};

    scope.upstreamList = [];
    scope.upstreamNext = {offset: ''};

    scope.serviceList = [];
    scope.serviceNext = {offset: ''};

    /**
     * Retrieves the SNIs associated with the current certificate.
     *
     * @param {string|object|null} filters - Filters to the Admin API endpoint.
     * @return boolean - True if request could be made, false otherwise
     */
    scope.fetchSniList = (filters = null) => {
        const request = restClient.get(`/certificates/${scope.certId}/snis` + urlQuery(filters));

        viewFrame.setLoaderSteps(1);

        request.then(({data: response}) => {
            scope.sniNext.offset = urlOffset(response.next);

            for (let sni of response.data) {
                sni.subTagsText = _.isEmpty(sni.tags) ? epochToDate(sni.created_at) : _.implode(sni.tags);
                scope.sniList.push(sni);
            }
        });

        request.catch(() => {
            toast.warning('Unable to fetch SNIs.');
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

        viewFrame.setLoaderSteps(1);

        request.then(({data: response}) => {
            scope.upstreamNext = urlOffset(response.next);

            for (let upstream of response.data) {
                scope.upstreamList.push({
                    id: upstream.id,
                    displayText: _.isText(upstream.name) ? upstream.name : simplifyObjectId(upstream.id),
                    subTagsText: _.isEmpty(upstream.tags) ? epochToDate(upstream.created_at) : _.implode(upstream.tags)
                });
            }

            delete response.data;
        });

        request.catch(() => {
            toast.warning('Unable to fetch upstreams.');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });
    };

    scope.fetchServiceList = function (filters = null) {
        const request = restClient.get(`/certificates/${scope.certId}/services` + urlQuery(filters));

        viewFrame.setLoaderSteps(1);

        request.then(({data: response}) => {
            scope.serviceNext = urlOffset(response.next);

            for (let service of response.data) {
                scope.serviceList.push({
                    id: service.id,
                    displayText: _.isText(service.name) ? service.name : `${service.host}:${service.port}`,
                    subTagsText: _.isEmpty(service.tags) ? epochToDate(service.created_at) : _.implode(service.tags)
                });
            }

            delete response.data;
        });

        request.catch(() => {
            toast.warning('Unable to fetch services.');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });
    };

    /**
     * Builds certificate object from the model and submits the form.
     *
     * @param {Event} event - The current event object.
     * @returns {boolean} True if request could be made, false otherwise.
     */
    scope.submitCertificateForm = function (event) {
        event.preventDefault();

        if (eventLocks.submitCertForm === true) return false;

        if (scope.certModel.cert.length <= 10) {
            toast.error('Please paste a valid certificate.');
            return false;
        }

        if (scope.certModel.key.length <= 10) {
            toast.error('Please paste a valid key for the certificate.');
            return false;
        }

        eventLocks.submitCertForm = true;
        viewFrame.setLoaderSteps(1);

        const payload = _.deepClone(scope.certModel);

        if (restConfig.method === 'PATCH') delete payload.snis;

        if (scope.certModel.cert_alt.length <= 0 || scope.certModel.key_alt.length <= 0) {
            delete payload.cert_alt;
            delete payload.key_alt;
        }

        const request = restClient.request({method: restConfig.method, resource: restConfig.endpoint, data: payload});

        request.then(({data: response}) => {
            if (_.isNone(scope.certId)) {
                const createdAt = epochToDate(response.created_at, viewFrame.getConfig('dateFormat'));

                scope.certId = response.id;

                restConfig.method = 'PATCH';
                restConfig.endpoint = `${restConfig.endpoint}/${scope.certId}`;
            }

            toast.success('Certificate details saved successfully.');
        });

        request.catch(() => {
            toast.error('Unable to save certificate details.');
        });

        request.finally(() => {
            eventLocks.submitCertForm = false;
            viewFrame.incrementLoader();
        });

        return true;
    };

    /**
     * Builds SNI object from the model and submits the form.
     *
     * @param {Event} event - The current event object.
     * @returns {boolean} False always.
     */
    scope.submitSNIForm = function (event) {
        event.preventDefault();

        if (eventLocks.submitSNIForm === true) return false;

        const exploded = _.explode(scope.sniModel.shorthand);
        if (exploded.length <= 0) return false;

        eventLocks.submitSNIForm = true;
        viewFrame.setLoaderSteps(1);

        const payload = {name: exploded[0], certificate: {id: scope.certId}, tags: []};

        for (let index = 1; index < exploded.length; index++) {
            payload.tags.push(exploded[index]);
        }

        const request = restClient.post(`/certificates/${scope.certId}/snis`, payload);

        request.then(({data: response}) => {
            response.tags = response.tags.length >= 1 ? response.tags.join(', ') : 'No tags added.';

            scope.sniList.push(response);
            toast.success(`Added new SNI ${response.name}.`);
        });

        request.catch(({status}) => {
            toast.error(status === 409 ? 'SNI already added to this certificate.' : 'Unable to save SNI.');
        });

        request.finally(() => {
            scope.sniModel.shorthand = '';
            eventLocks.submitSNIForm = false;

            viewFrame.incrementLoader();
        });

        return false;
    };

    /**
     * Resets certificate details form if the user confirms the prompt.
     *
     * @param {Event} event - The current event object.
     * @returns {boolean} True if form has been reset, false otherwise.
     */
    scope.resetCertForm = function (event) {
        event.preventDefault();

        if (eventLocks.submitCertForm === true) return false;

        const proceed = confirm('Proceed to clear the form?');

        if (proceed) scope.certModel = _.deepClone(certModel);

        return proceed;
    };

    /**
     * Deletes the table row entry upon clicking the bin icon.
     *
     * @type {function(Event): boolean}
     */
    scope.deleteTableRow = deleteMethodInitiator(restClient, (err, properties) => {
        if (_.isText(err)) toast.error(err);
        else toast.success(`${properties.target} deleted successfully.`);
    });

    viewFrame.clearBreadcrumbs();
    viewFrame.addBreadcrumb('/certificates', 'Certificates');

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

        viewFrame.setLoaderSteps(4);

        request.then(({data: response}) => {
            refreshCertModel(scope.certModel, response);

            viewFrame.addAction(
                'Delete',
                '#!/certificates',
                'critical delete',
                'certificate',
                `/certificates/${scope.certId}`
            );

            viewFrame.addBreadcrumb(location.path(), simplifyObjectId(response.id));
        });

        request.catch(() => {
            toast.error('Could not load certificate details');
            window.location.href = '#!/certificates';
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });

        scope.fetchSniList();
        scope.fetchServiceList();
        scope.fetchUpstreamList();
    }
}
