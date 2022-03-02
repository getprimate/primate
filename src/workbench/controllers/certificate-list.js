/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import {isEmpty, isText, implode} from '../lib/core-toolkit.js';
import {epochToDate} from '../helpers/date-lib.js';
import {urlQuery, urlOffset, simplifyObjectId, deleteMethodInitiator} from '../helpers/rest-toolkit.js';

/**
 * Provides controller constructor for listing all certificates and SNIs.
 *
 * @constructor
 *
 * @param {Object} scope - Injected scope object.
 * @param {RESTClientFactory} restClient - Customised HTTP REST client factory.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 * @param {ToastFactory} toast - Factory for displaying notifications.
 */
export default function CertificateListController(scope, restClient, viewFrame, toast) {
    scope.certList = [];
    scope.certNext = {offset: ''};

    scope.caList = [];
    scope.caNext = {offset: ''};

    scope.sniList = [];
    scope.sniNext = {offset: ''};

    /**
     * Retrieves certificates from the specified resource.
     *
     * @param {string|object|null} filters - Filters to the Admin API.
     * @return {boolean} True if request could be made, false otherwise.
     */
    scope.fetchCertList = (filters = null) => {
        const request = restClient.get('/certificates' + urlQuery(filters));

        viewFrame.setLoaderSteps(1);

        request.then(({data: response}) => {
            scope.certNext.offset = urlOffset(response.next);

            for (let certificate of response.data) {
                scope.certList.push({
                    id: certificate.id,
                    displayText: simplifyObjectId(certificate.id),
                    subTagsText: isEmpty(certificate.tags)
                        ? epochToDate(certificate.created_at)
                        : implode(certificate.tags)
                });
            }

            delete response.data;
        });

        request.catch(() => {
            toast.error('Unable to fetch public certificates.');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });

        return true;
    };

    /**
     * Retrieves CAs from the specified resource.
     *
     * @param {string|object|null} filters - Filters to the Admin API.
     * @return {boolean} True if request could be made, false otherwise.
     */
    scope.fetchCaList = (filters = null) => {
        const request = restClient.get('/ca_certificates' + urlQuery(filters));

        viewFrame.setLoaderSteps(1);

        request.then(({data: response}) => {
            scope.caNext.offset = urlOffset(response.next);

            for (let ca of response.data) {
                scope.caList.push({
                    id: ca.id,
                    displayText: simplifyObjectId(ca.id),
                    subTagsText: isEmpty(ca.tags) ? epochToDate(ca.created_at) : implode(ca.tags)
                });
            }

            delete response.data;
        });

        request.catch(() => {
            toast.error('Unable to fetch CA certificates.');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });

        return true;
    };

    /**
     * Retrieves SNI objects from the specified resource.
     *
     * @param {string|object|null} filters - Filters to the Admin API.
     * @return {boolean} True if request could be made, false otherwise.
     */
    scope.fetchSniList = (filters = null) => {
        const request = restClient.get('/snis' + urlQuery(filters));

        viewFrame.setLoaderSteps(1);

        request.then(({data: response}) => {
            scope.sniNext.offset = urlOffset(response.next);

            for (let sni of response.data) {
                sni.certificate.displayText = simplifyObjectId(sni.certificate.id);
                scope.sniList.push(sni);
            }

            delete response.data;
        });

        request.catch(() => {
            toast.error('Unable to fetch SNIs.');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });

        return true;
    };

    /**
     * Deletes the table row entry upon clicking the bin icon.
     *
     * @type {function(Event): boolean}
     */
    scope.deleteTableRow = deleteMethodInitiator(restClient, (err) => {
        if (isText(err)) toast.error(err);
        else toast.success('Certificate deleted successfully.');
    });

    viewFrame.clearBreadcrumbs();

    viewFrame.setTitle('Certificates');
    viewFrame.setLoaderSteps(3);

    viewFrame.addBreadcrumb('#!/certificates', 'Certificates');
    viewFrame.addAction('New Certificate', '#!/certificates/__create__');
    viewFrame.addAction('New Trusted CA', '#!/trusted-cas/__create__');

    scope.fetchCertList();
    scope.fetchCaList();
    scope.fetchSniList();
}
